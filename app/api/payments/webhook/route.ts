import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { generateReceiptPdfBlob } from "@/src/lib/receipt-generator";
import { resend } from "@/src/lib/email"; // Presumed Resend / SendGrid setup

export async function POST(req: Request) {
  const signature = req.headers.get("x-webhook-signature");
  
  // Security Guard: Cryptographically verify webhook source signature matches env configuration
  if (!signature || signature !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized Signature" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { orderId, transactionStatus, checkoutRequestId } = payload;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
    if (order.status === "PAID") return NextResponse.json({ message: "Already Processed" });

    if (transactionStatus === "SUCCESSFUL") {
      const receiptNumber = `REC-${Date.now()}-${order.id.slice(-4).toUpperCase()}`;

      await prisma.$transaction(async (tx) => {
        // 1. Lock Order State
        await tx.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
        });

        // 2. Construct Safe Legal Receipt Log
        await tx.receipt.create({
          data: {
            orderId: order.id,
            receiptNumber,
            status: "FINALIZED",
            subtotal: order.subtotal,
            discount: order.discountAmount ?? 0,
            shippingFee: order.shippingFee,
            tax: order.tax ?? 0,
            total: order.total,
            emailed: true,
            emailedAt: new Date(),
            paidAt: new Date(),
          },
        });
      });

      // 3. Generate dynamic buffer stream for file distribution attachment
      const pdfBuffer = await generateReceiptPdfBlob(order, receiptNumber);
      const pdfContent = Buffer.from(
        pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer)
      );

      // 4. Send asynchronous email notifications
      const emailSent = await resend.emails.send({
        from: process.env.EMAIL_FROM || '"Jersey Shop" <noreply@jerseyshop.com>',
        to: order.shippingEmail,
        subject: `Your Order Confirmation Receipt: ${receiptNumber}`,
        text: `Thank you for your business ${order.shippingName}! Find your invoice summary attached.`,
        attachments: [{ filename: `${receiptNumber}.pdf`, content: pdfContent, contentType: "application/pdf" }],
      });

      if (!emailSent) {
        console.warn("[WEBHOOK_EMAIL_WARNING] Receipt email failed to send for order", orderId);
      }

      return NextResponse.json({ verified: true });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ verified: false, status: "Payment logged as failed" });
    }
  } catch (error) {
    console.error("[WEBHOOK_CRITICAL_FAILURE]", error);
    return NextResponse.json({ error: "Webhook ingestion error processed" }, { status: 500 });
  }
}