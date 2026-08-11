import { NextResponse } from "next/server";

const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";

function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function normalizeMpesaPhone(raw: string): string {
  return String(raw)
    .trim()
    .replace(/\s+/g, "")
    .replace(/^\+/, "")
    .replace(/^0/, "254");
}

export async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = requireEnvVar("MPESA_CONSUMER_KEY");
  const consumerSecret = requireEnvVar("MPESA_CONSUMER_SECRET");
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`Failed to obtain M-Pesa access token: ${payload}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("M-Pesa access token was not returned by the provider");
  }

  return data.access_token;
}

export async function createMpesaStkPush({
  phone,
  amount,
  orderId,
}: {
  phone: string;
  amount: number;
  orderId: string;
}) {
  const shortcode = requireEnvVar("MPESA_SHORTCODE");
  const passkey = requireEnvVar("MPESA_PASSKEY");
  const callbackUrl = requireEnvVar("MPESA_CALLBACK_URL");

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const token = await getMpesaAccessToken();

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: `Order-${orderId}`,
    TransactionDesc: "Jersey Shop Payment",
  };

  console.debug("[M-PESA STK PUSH] request:", { phone, amount, orderId, payload });

  const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch((err) => {
    console.error("[M-PESA STK PUSH] invalid JSON response", err);
    throw err;
  });

  console.debug("[M-PESA STK PUSH] response:", data);
  return data;
}

export async function queryMpesaStkPush(checkoutRequestId: string) {
  const shortcode = requireEnvVar("MPESA_SHORTCODE");
  const passkey = requireEnvVar("MPESA_PASSKEY");
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const token = await getMpesaAccessToken();

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  return res.json();
}

export async function sendMpesaB2C({
  phone,
  amount,
  reference,
  remarks,
}: {
  phone: string;
  amount: number;
  reference: string;
  remarks?: string;
}) {
  const shortcode = requireEnvVar("MPESA_SHORTCODE");
  const initiatorName = requireEnvVar("MPESA_B2C_INITIATOR_NAME");
  const securityCredential = requireEnvVar("MPESA_B2C_SECURITY_CREDENTIAL");
  const callbackUrl = requireEnvVar("MPESA_B2C_CALLBACK_URL");

  const token = await getMpesaAccessToken();

  const payload = {
    Initiator: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: "BusinessPayment",
    Amount: amount,
    PartyA: shortcode,
    PartyB: phone,
    Remarks: remarks ?? "Jersey Shop withdrawal",
    QueueTimeOutURL: callbackUrl,
    ResultURL: callbackUrl,
    Occasion: reference,
  };

  console.debug("[M-PESA B2C] request:", { phone, amount, reference, payload });

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch((err) => {
    console.error("[M-PESA B2C] invalid JSON response", err);
    throw err;
  });

  console.debug("[M-PESA B2C] response:", data);

  if (!res.ok || (data?.ResponseCode !== "0" && data?.responseCode !== "0")) {
    const msg = data?.errorMessage || data?.error || JSON.stringify(data);
    throw new Error(`M-Pesa B2C request failed: ${msg}`);
  }

  return data;
}
