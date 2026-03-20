import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const consumerKey    = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials    = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error("Failed to get M-Pesa access token");
  const data = await res.json();
  return data.access_token;
}

// ─── POST /api/payments/mpesa/initiate ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone, amount, orderId } = body ?? {};

    if (!phone || !amount || !orderId) {
      return NextResponse.json(
        { error: "Phone, amount and orderId are required" },
        { status: 400 }
      );
    }

    // Normalize phone — must be 254XXXXXXXXX format
    const normalized = String(phone)
      .replace(/\s/g, "")
      .replace(/^0/, "254")
      .replace(/^\+/, "");

    if (!/^2547\d{8}$/.test(normalized)) {
      return NextResponse.json(
        { error: "Invalid phone number. Use format 07XXXXXXXX" },
        { status: 400 }
      );
    }

    const amountInt = Math.ceil(Number(amount));
    if (!Number.isFinite(amountInt) || amountInt <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey   = process.env.MPESA_PASSKEY!;
    const timestamp = getTimestamp();
    const password  = getPassword(shortcode, passkey, timestamp);
    const token     = await getAccessToken();

    const stkRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
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
          TransactionType:   "CustomerPayBillOnline",
          Amount:            amountInt,
          PartyA:            normalized,
          PartyB:            shortcode,
          PhoneNumber:       normalized,
          CallBackURL:       process.env.MPESA_CALLBACK_URL!,
          AccountReference:  `Order-${orderId}`,
          TransactionDesc:   "Jersey Shop Payment",
        }),
      }
    );

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== "0") {
      console.error("STK Push failed:", stkData);
      return NextResponse.json(
        { error: stkData.errorMessage || "STK Push failed. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success:           true,
      checkoutRequestId: stkData.CheckoutRequestID,
      message:           "Payment prompt sent to your phone. Enter your M-Pesa PIN to complete.",
    });
  } catch (err) {
    console.error("M-Pesa initiate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}