import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { generateReceiptPdfBlob } from "@/src/lib/receipt-generator";
import { resend } from "@/src/lib/email";
import { broadcastOrderUpdate } from "@/app/api/admin/orders/stream/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const resultCode = callback.ResultCode;
    const accountRef = callback.CallbackMetadata?.Item?.find(
      (i: any) => i.Name === "AccountReference"
    )?.Value as string | undefined;

    const orderId = accountRef?.replace("Order-", "");

    if (resultCode === 0 && orderId) {
      const order = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
          include: {
            items: {
              include: { product: true },
            },
          },
        });

        await tx.orderTimeline.create({
          data: {
            orderId,
            status: "PAID",
            message: "M-Pesa payment received and verified.",
            actor: "SYSTEM",
          },
        });

        await tx.receipt.upsert({
          where: { orderId },
          create: {
            orderId,
            receiptNumber: `REC-${updatedOrder.orderNumber}`,
            status: "FINALIZED",
            subtotal: updatedOrder.subtotal,
            discount: updatedOrder.discountAmount,
            shippingFee: updatedOrder.shippingFee,
            tax: updatedOrder.tax,
            total: updatedOrder.total,
            emailed: true,
            emailedAt: new Date(),
            paidAt: new Date(),
          },
          update: {
            status: "FINALIZED",
            subtotal: updatedOrder.subtotal,
            discount: updatedOrder.discountAmount,
            shippingFee: updatedOrder.shippingFee,
            tax: updatedOrder.tax,
            total: updatedOrder.total,
            emailed: true,
            emailedAt: new Date(),
            paidAt: new Date(),
          },
        });

        return updatedOrder;
      });

      broadcastOrderUpdate(orderId, "PAID");

      const receiptNumber = `REC-${order.orderNumber}`;
      const pdfBuffer = await generateReceiptPdfBlob(order, receiptNumber);

      const emailSent = await resend.emails.send({
        from: process.env.EMAIL_FROM || '"Jersey Shop" <noreply@jerseyshop.com>',
        to: order.shippingEmail,
        subject: `Your order receipt ${receiptNumber}`,
        text: `Thank you for your purchase. Your receipt is attached.`,
        attachments: [
          {
            filename: `${receiptNumber}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      if (!emailSent) {
        console.warn("[M-PESA CALLBACK] Receipt email failed to send for order", orderId);
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
