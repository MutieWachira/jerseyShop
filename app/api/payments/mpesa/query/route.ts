import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";

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

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${credentials}` }, cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to get access token");
  const data = await res.json();
  return data.access_token;
}

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
    const token     = await getAccessToken();

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

    // ResultCode 0 = success, 1032 = cancelled, others = pending/failed
    return NextResponse.json({
      resultCode:    data.ResultCode,
      resultDesc:    data.ResultDesc,
      paid:          data.ResultCode === "0",
      cancelled:     data.ResultCode === "1032",
    });
  } catch (err) {
    console.error("M-Pesa query error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}