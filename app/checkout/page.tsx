"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart, CartItem, CompetitionBadge } from "@/src/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Smartphone,
  CreditCard,
  Loader2,
  Award,
  CheckCircle2,
} from "lucide-react";

// ─── Pricing ──────────────────────────────────────────────────────────────────

const BADGE_PRICE  = 200;
const NAME_PRICE   = 100;
const NUMBER_PRICE = 100;

function getCustomisationCost(item: CartItem): number {
  let cost = 0;
  if (item.competitionBadge && item.competitionBadge !== "NONE") cost += BADGE_PRICE;
  if (item.playerName)   cost += NAME_PRICE;
  if (item.playerNumber) cost += NUMBER_PRICE;
  return cost;
}

const BADGE_LABELS: Record<CompetitionBadge, string> = {
  NONE:             "No Badge",
  PREMIER_LEAGUE:   "Premier League",
  CHAMPIONS_LEAGUE: "Champions League",
  EUROPA_LEAGUE:    "Europa League",
  FA_CUP:           "FA Cup",
  SERIE_A:          "Serie A",
  LA_LIGA:          "La Liga",
  BUNDESLIGA:       "Bundesliga",
  LIGUE_1:          "Ligue 1",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = "mpesa" | "card";
type Step = "shipping" | "payment" | "processing";

interface ShippingForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</label>
      {children}
    </div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router              = useRouter();
  const { data: session }   = useSession();

  const [step,          setStep]          = useState<Step>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [mpesaPhone,    setMpesaPhone]    = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [orderId,       setOrderId]       = useState("");

  // M-Pesa polling state
  const [mpesaStatus,         setMpesaStatus]         = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [checkoutRequestId,   setCheckoutRequestId]   = useState("");
  const [mpesaStatusMessage,  setMpesaStatusMessage]  = useState("");

  const [shipping, setShipping] = useState<ShippingForm>({
    name:    session?.user?.name  || "",
    email:   session?.user?.email || "",
    phone:   "",
    address: "",
    city:    "",
  });

  // ── Totals ──
  const jerseyTotal        = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const customisationTotal = cart.reduce((s, i) => s + getCustomisationCost(i), 0);
  const grandTotal         = jerseyTotal + customisationTotal;

  const handleShipping = (e: React.ChangeEvent<HTMLInputElement>) =>
    setShipping((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ── Step 1: Create order in DB, return orderId ──
  const createOrder = async (): Promise<string | null> => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipping,
        paymentMethod,
        items: cart.map((item) => ({
          productId:         item.id,
          variantId:         item.variantId,
          quantity:          item.quantity,
          price:             item.price,
          customisationCost: getCustomisationCost(item),
          customisation: {
            competitionBadge: item.competitionBadge || "NONE",
            playerName:       item.playerName       || "",
            playerNumber:     item.playerNumber      || "",
          },
        })),
        total: grandTotal,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create order");
      return null;
    }
    return data.orderId;
  };

  // ── M-Pesa flow ──
  const handleMpesaPayment = async () => {
    setError("");
    setLoading(true);

    const phone = mpesaPhone.trim() || shipping.phone.trim();
    if (!phone) {
      setError("Please enter your M-Pesa phone number.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create order first
      const newOrderId = await createOrder();
      if (!newOrderId) { setLoading(false); return; }
      setOrderId(newOrderId);

      // 2. Initiate STK Push
      const res = await fetch("/api/payments/mpesa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount: grandTotal, orderId: newOrderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send payment prompt");
        setLoading(false);
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setMpesaStatus("pending");
      setMpesaStatusMessage("Check your phone and enter your M-Pesa PIN...");
      setStep("processing");

      // 3. Poll for payment confirmation every 4 seconds, up to 10 times (40s)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const queryRes = await fetch("/api/payments/mpesa/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkoutRequestId: data.checkoutRequestId }),
          });
          const queryData = await queryRes.json();

          if (queryData.paid) {
            clearInterval(poll);
            setMpesaStatus("success");
            setMpesaStatusMessage("Payment confirmed!");
            clearCart();
          } else if (queryData.cancelled || attempts >= 10) {
            clearInterval(poll);
            setMpesaStatus("failed");
            setMpesaStatusMessage(
              queryData.cancelled
                ? "Payment was cancelled."
                : "Payment timed out. Please try again."
            );
          }
        } catch {
          // silently continue polling on network blip
        }
      }, 4000);

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Flutterwave (card/bank) flow ──
  const handleFlutterwavePayment = async () => {
    setError("");
    setLoading(true);

    try {
      // 1. Create order
      const newOrderId = await createOrder();
      if (!newOrderId) { setLoading(false); return; }
      setOrderId(newOrderId);

      // 2. Get Flutterwave hosted payment URL
      const res = await fetch("/api/payments/flutterwave/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:  grandTotal,
          email:   shipping.email,
          name:    shipping.name,
          phone:   shipping.phone,
          orderId: newOrderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to initiate payment");
        setLoading(false);
        return;
      }

      // 3. Redirect to Flutterwave hosted checkout
      // Flutterwave will redirect back to /checkout/confirm?orderId=...
      clearCart();
      window.location.href = data.paymentUrl;

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === "mpesa") {
      handleMpesaPayment();
    } else {
      handleFlutterwavePayment();
    }
  };

  // ── Processing / result screen ──
  if (step === "processing") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">

          {mpesaStatus === "pending" && (
            <>
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <Loader2 size={64} className="animate-spin text-slate-300" />
                <Smartphone size={24} className="absolute text-slate-900" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Waiting for Payment</h2>
                <p className="mt-2 text-slate-500 text-sm">{mpesaStatusMessage}</p>
                <p className="mt-1 text-xs text-slate-400">
                  A prompt has been sent to your phone.<br />
                  Enter your M-Pesa PIN to complete the payment.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-sm font-black text-emerald-800">
                  Amount: Ksh {grandTotal.toLocaleString()}
                </p>
              </div>
            </>
          )}

          {mpesaStatus === "success" && (
            <>
              <CheckCircle2 size={64} className="text-emerald-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
                {orderId && (
                  <p className="text-sm text-slate-400 font-mono mt-1">
                    Order #{orderId.slice(-8).toUpperCase()}
                  </p>
                )}
                <p className="mt-2 text-slate-500 text-sm">
                  Your order has been placed. We'll start processing it right away.
                </p>
              </div>
              <button
                onClick={() => router.push("/shop")}
                className="w-full rounded-xl bg-slate-900 py-3 font-black text-white hover:bg-slate-800 transition"
              >
                Continue Shopping
              </button>
            </>
          )}

          {mpesaStatus === "failed" && (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">✕</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Payment Failed</h2>
                <p className="mt-2 text-slate-500 text-sm">{mpesaStatusMessage}</p>
              </div>
              <button
                onClick={() => {
                  setStep("payment");
                  setMpesaStatus("idle");
                  setError("");
                }}
                className="w-full rounded-xl bg-slate-900 py-3 font-black text-white hover:bg-slate-800 transition"
              >
                Try Again
              </button>
            </>
          )}

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">

        <h1 className="text-3xl font-black text-slate-900 mb-10">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">

          {/* ── Left: Form ── */}
          <div className="md:col-span-2 space-y-6">

            {/* ── Shipping ── */}
            {step === "shipping" && (
              <div className="rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-black text-slate-900">Shipping Information</h2>

                <Field label="Full Name">
                  <input name="name" value={shipping.name} onChange={handleShipping}
                    placeholder="John Doe" required className={inputClass} />
                </Field>
                <Field label="Email Address">
                  <input type="email" name="email" value={shipping.email} onChange={handleShipping}
                    placeholder="john@example.com" required className={inputClass} />
                </Field>
                <Field label="Phone Number">
                  <input type="tel" name="phone" value={shipping.phone} onChange={handleShipping}
                    placeholder="07XX XXX XXX" required className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Delivery Address">
                    <input name="address" value={shipping.address} onChange={handleShipping}
                      placeholder="Street / Estate" required className={inputClass} />
                  </Field>
                  <Field label="City">
                    <input name="city" value={shipping.city} onChange={handleShipping}
                      placeholder="Nairobi" required className={inputClass} />
                  </Field>
                </div>

                <button
                  onClick={() => {
                    if (!shipping.name || !shipping.email || !shipping.phone || !shipping.address || !shipping.city) {
                      setError("Please fill in all shipping fields.");
                      return;
                    }
                    setError("");
                    setStep("payment");
                  }}
                  className="w-full rounded-xl bg-slate-900 py-3 font-black text-white hover:bg-slate-800 transition"
                >
                  Continue to Payment
                </button>

                {error && (
                  <p className="text-sm font-bold text-rose-600 text-center">{error}</p>
                )}
              </div>
            )}

            {/* ── Payment ── */}
            {step === "payment" && (
              <div className="rounded-2xl border border-slate-200 p-6 space-y-5">

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep("shipping")}
                    className="text-xs font-black text-slate-400 hover:text-slate-700 transition"
                  >
                    ← Back
                  </button>
                  <h2 className="text-base font-black text-slate-900">Payment Method</h2>
                </div>

                {/* Toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      paymentMethod === "mpesa"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone size={20} className="shrink-0" />
                    <div>
                      <p className="text-sm font-black">M-Pesa</p>
                      <p className={`text-[10px] ${paymentMethod === "mpesa" ? "text-slate-300" : "text-slate-400"}`}>
                        STK Push — enter PIN only
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      paymentMethod === "card"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard size={20} className="shrink-0" />
                    <div>
                      <p className="text-sm font-black">Card / Bank</p>
                      <p className={`text-[10px] ${paymentMethod === "card" ? "text-slate-300" : "text-slate-400"}`}>
                        Visa, Mastercard, Bank
                      </p>
                    </div>
                  </button>
                </div>

                {/* M-Pesa info */}
                {paymentMethod === "mpesa" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                      <p className="font-black mb-1">How it works:</p>
                      <p className="text-xs leading-relaxed">
                        After clicking Pay, a prompt will appear on your phone asking you to enter your
                        M-Pesa PIN. The amount will be deducted automatically once you confirm.
                      </p>
                    </div>
                    <Field label="M-Pesa Number (if different from above)">
                      <input
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder={shipping.phone || "07XX XXX XXX"}
                        className={inputClass}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Leave blank to use {shipping.phone || "your shipping phone number"}
                      </p>
                    </Field>
                  </div>
                )}

                {/* Flutterwave info */}
                {paymentMethod === "card" && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                    <p className="font-black mb-1">Secure payment via Flutterwave:</p>
                    <p className="text-xs leading-relaxed">
                      You'll be redirected to a secure Flutterwave checkout page where you can pay
                      with Visa, Mastercard, or direct bank transfer. You'll be brought back here
                      once payment is complete.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-900 py-4 font-black text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    `Pay Ksh ${grandTotal.toLocaleString()} via ${paymentMethod === "mpesa" ? "M-Pesa" : "Card / Bank"}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Order Summary ── */}
          <div className="h-fit rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">Order Summary</h2>

            <div className="space-y-3">
              {cart.map((item) => {
                const customCost = getCustomisationCost(item);
                return (
                  <div key={`${item.id}-${item.size}-${item.version}`} className="flex gap-3">
                    <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="absolute inset-0 bg-slate-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {item.size && (
                          <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {item.size}
                          </span>
                        )}
                        {item.version && (
                          <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {item.version}
                          </span>
                        )}
                      </div>
                      {customCost > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.competitionBadge && item.competitionBadge !== "NONE" && (
                            <p className="text-[9px] text-slate-400 flex items-center gap-1">
                              <Award size={8} /> {BADGE_LABELS[item.competitionBadge]} patch
                            </p>
                          )}
                          {item.playerNumber && (
                            <p className="text-[9px] text-slate-400">
                              #{item.playerNumber}{item.playerName ? ` · ${item.playerName}` : ""}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-900">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-slate-400">×{item.quantity}</p>
                      {customCost > 0 && (
                        <p className="text-[9px] font-black text-emerald-600">+Ksh {customCost}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Jerseys</span>
                <span className="font-bold">Ksh {jerseyTotal.toLocaleString()}</span>
              </div>
              {customisationTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customisation</span>
                  <span className="font-bold text-emerald-700">+Ksh {customisationTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2">
                <span>Total</span>
                <span>Ksh {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}