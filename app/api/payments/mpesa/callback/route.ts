import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { broadcastOrderUpdate } from "@/app/api/admin/orders/stream/route";

// ─── POST /api/payments/mpesa/callback ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body     = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const resultCode        = callback.ResultCode;
    const accountRef        = callback.CallbackMetadata?.Item?.find(
      (i: any) => i.Name === "AccountReference"
    )?.Value as string | undefined;

    const orderId = accountRef?.replace("Order-", "");

    if (resultCode === 0 && orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data:  { status: "PAID" },
      });

      // Broadcast status change to all connected admin browsers instantly
      broadcastOrderUpdate(orderId, "PAID");
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}