import { NextRequest, NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { auditLog } from "@/src/lib/audit";
import { generateReceiptPdfBlob } from "@/src/lib/receipt-generator";
import { resend } from "@/src/lib/email";
import { broadcastOrderUpdate } from "@/app/api/admin/orders/stream/route";

function getFirstParameterValue(parameters: any[], keyNames: string[]) {
  if (!Array.isArray(parameters)) return undefined;
  const found = parameters.find((item) => {
    const key = item.Key || item.Name || item.name || item.key;
    return key && keyNames.includes(key);
  });
  return found?.Value || found?.value;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.debug("[M-PESA CALLBACK] received body:", body);

    // Record audit for incoming provider callback
    auditLog({
      actorType: "PROVIDER",
      action: "MPESA_CALLBACK_RECEIVED",
      resourceType: "MPESA_CALLBACK",
      metadata: body,
      level: "INFO",
    }).catch(() => {});
    const stkCallback = body?.Body?.stkCallback;
    const b2cResult = body?.Result || body?.Body?.Result;

    if (stkCallback) {
      console.debug("[M-PESA CALLBACK] STK callback:", stkCallback);
      const resultCode = stkCallback.ResultCode;
      const accountRef = getFirstParameterValue(stkCallback.CallbackMetadata?.Item, [
        "AccountReference",
        "Account Ref",
        "Account Reference",
        "Reference",
      ]) as string | undefined;
      const checkoutRequestId =
        stkCallback.CheckoutRequestID ||
        stkCallback?.CheckoutRequestID ||
        stkCallback.CheckoutRequestId ||
        stkCallback.checkoutRequestId;
      const transactionId = getFirstParameterValue(stkCallback.CallbackMetadata?.Item, [
        "MpesaReceiptNumber",
        "MpesaReceipt",
        "TransactionID",
        "TransID",
      ]) as string | undefined;

      let orderId = accountRef?.replace(/^Order-/, "");
      if (!orderId && checkoutRequestId) {
        const payment = await prisma.payment.findFirst({
          where: { checkoutRequestId },
          select: { orderId: true },
        });
        orderId = payment?.orderId;
      }

      const paymentWhere: Record<string, any> = {};
      if (orderId) paymentWhere.orderId = orderId;
      if (checkoutRequestId) paymentWhere.checkoutRequestId = checkoutRequestId;

      if (!orderId) {
        console.warn("[M-PESA CALLBACK] Missing Order reference in STK callback", {
          stkCallback,
          checkoutRequestId,
        });
      }

      const paymentUpdateData = {
        status: resultCode === 0 ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
        transactionId: transactionId || undefined,
        gatewayResponse: body,
      };

      if (checkoutRequestId && Object.keys(paymentWhere).length > 0) {
        await prisma.payment.updateMany({
          where: paymentWhere,
          data: paymentUpdateData,
        });

        auditLog({
          actorType: "PROVIDER",
          action: "PAYMENT_CALLBACK_UPDATED",
          resourceType: "Payment",
          resourceId: checkoutRequestId,
          metadata: paymentUpdateData,
        }).catch(() => {});
      }

      if (resultCode === 0 && orderId) {
        console.debug("[M-PESA CALLBACK] payment success for orderId:", orderId);
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

        auditLog({
          actorType: "SYSTEM",
          action: "ORDER_PAID",
          resourceType: "Order",
          resourceId: orderId,
          metadata: { receiptNumber },
        }).catch(() => {});

        const receiptNumber = `REC-${order.orderNumber}`;
        const pdfBuffer = await generateReceiptPdfBlob(order, receiptNumber);
        const pdfContent = Buffer.from(pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer));

        const emailSent = await resend.emails.send({
          from: process.env.EMAIL_FROM || '"Jersey Shop" <noreply@jerseyshop.com>',
          to: order.shippingEmail,
          subject: `Your order receipt ${receiptNumber}`,
          text: `Thank you for your purchase. Your receipt is attached.`,
          attachments: [
            {
              filename: `${receiptNumber}.pdf`,
              content: pdfContent,
              contentType: "application/pdf",
            },
          ],
        });

        if (!emailSent) {
          console.warn("[M-PESA CALLBACK] Receipt email failed to send for order", orderId);
        }
      } else if (resultCode !== 0 && orderId) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "FAILED" },
          });

          await tx.orderTimeline.create({
            data: {
              orderId,
              status: "FAILED",
              message: "M-Pesa payment attempt failed.",
              actor: "SYSTEM",
            },
          });
        });
      }

      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (b2cResult) {
      console.debug("[M-PESA CALLBACK] B2C callback:", b2cResult);
      const resultCode = b2cResult.ResultCode ?? b2cResult.ResultType;
      const resultDesc = b2cResult.ResultDesc ?? b2cResult.ResultDescription;
      const parameters = b2cResult.ResultParameters?.ResultParameter || b2cResult.ResultParameters || [];
      const occasion = getFirstParameterValue(parameters, ["Occasion", "Reference", "TransactionDesc"]);
      const transactionId = getFirstParameterValue(parameters, ["TransactionID", "TransID"])
        || b2cResult.TransactionID
        || b2cResult.ConversationID;
      const reference = occasion || b2cResult.Occasion || b2cResult.OriginatorConversationID || b2cResult.ConversationID;

      if (reference) {
        await prisma.withdrawal.updateMany({
          where: { reference },
          data: {
            status: resultCode === 0 ? "COMPLETED" : "FAILED",
            transactionId: transactionId || undefined,
            gatewayResponse: body,
          },
        });

        auditLog({
          actorType: "PROVIDER",
          action: "WITHDRAWAL_CALLBACK",
          resourceType: "Withdrawal",
          resourceId: reference,
          metadata: { resultCode, resultDesc, transactionId },
        }).catch(() => {});
      } else {
        console.warn("[M-PESA B2C CALLBACK] Missing withdrawal reference", { resultCode, resultDesc, body });
      }

      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
