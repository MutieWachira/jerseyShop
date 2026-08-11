import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { auditLog } from "@/src/lib/audit";
import { getMpesaAccessToken } from "@/src/lib/mpesa";
import { PaymentMethod } from "@prisma/client";

function getTimestamp(): string {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
}

function getPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

// Use centralized helper that throws detailed errors when token fetch fails
// (see src/lib/mpesa.ts)

// ─── POST /api/payments/mpesa/query ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checkoutRequestId } = await req.json();

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "checkoutRequestId required" }, { status: 400 });
    }

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey   = process.env.MPESA_PASSKEY!;
    const timestamp = getTimestamp();
    const password  = getPassword(shortcode, passkey, timestamp);
    const token     = await getMpesaAccessToken();

    const res = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password:          password,
          Timestamp:         timestamp,
          CheckoutRequestID: checkoutRequestId,
        }),
      }
    );

    const data = await res.json();
    const paid = data.ResultCode === "0";
    const cancelled = data.ResultCode === "1032";

    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId, provider: PaymentMethod.MPESA },
    });

    if (payment) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { checkoutRequestId },
          data: {
            status: paid ? "SUCCESS" : cancelled ? "CANCELLED" : "PROCESSING",
            gatewayResponse: data,
          },
        });

        if (paid) {
          await tx.order.updateMany({
            where: { id: payment.orderId, status: { not: "PAID" } },
            data: { status: "PAID" },
          });
          await tx.orderTimeline.create({
            data: {
              orderId: payment.orderId,
              status: "PAID",
              message: "M-Pesa STK push confirmed via query. Payment marked as PAID.",
              actor: "SYSTEM",
              metadata: { checkoutRequestId },
            },
          });
        } else if (cancelled) {
          await tx.order.updateMany({
            where: { id: payment.orderId, status: { in: ["PENDING_PAYMENT", "PROCESSING"] } },
            data: { status: "FAILED" },
          });
          await tx.orderTimeline.create({
            data: {
              orderId: payment.orderId,
              status: "FAILED",
              message: "M-Pesa STK push was cancelled or failed (query).",
              actor: "SYSTEM",
              metadata: { checkoutRequestId },
            },
          });
        }
      });

      // record audit event for the query outcome
      auditLog({
        actorId: session.user.id,
        actorType: "USER",
        action: "PAYMENT_QUERY",
        resourceType: "Payment",
        resourceId: payment.id,
        metadata: { checkoutRequestId, result: data },
      }).catch(() => {});
    }

    return NextResponse.json({
      resultCode: data.ResultCode,
      resultDesc: data.ResultDesc,
      paid,
      cancelled,
    });
  } catch (err) {
    console.error("M-Pesa query error:", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}