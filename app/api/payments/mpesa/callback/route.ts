import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// ─── POST /api/payments/mpesa/callback ───────────────────────────────────────
// Safaricom calls this URL after payment is completed or failed.
// Must be publicly accessible (your Vercel URL).

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const resultCode       = callback.ResultCode;
    const checkoutRequestId = callback.CheckoutRequestID;
    const accountRef       = callback.CallbackMetadata?.Item?.find(
      (i: any) => i.Name === "AccountReference"
    )?.Value as string | undefined;

    // Extract order ID from AccountReference e.g. "Order-clxyz123"
    const orderId = accountRef?.replace("Order-", "");

    if (resultCode === 0 && orderId) {
      // Payment successful — update order status to PAID
      await prisma.order.update({
        where: { id: orderId },
        data:  { status: "PAID" },
      });
    }

    // Always return 200 to Safaricom to acknowledge receipt
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    // Still return 200 — don't let errors cause Safaricom to retry indefinitely
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}