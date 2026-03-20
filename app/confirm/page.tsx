"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

// ─── Inner component uses useSearchParams — must be inside Suspense ───────────

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const orderId = searchParams.get("orderId");
  const status  = searchParams.get("status");

  const [state,   setState]   = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderId) {
      setState("failed");
      setMessage("No order ID found.");
      return;
    }

    if (status === "successful" || status === "completed") {
      setState("success");
      setMessage("Payment confirmed! Your order has been placed.");
      return;
    }

    if (status === "cancelled") {
      setState("failed");
      setMessage("Payment was cancelled. Your order has not been placed.");
      return;
    }

    // M-Pesa success lands here with no status param
    setState("success");
    setMessage("Your order has been placed successfully.");
  }, [orderId, status]);

  return (
    <div className="max-w-md w-full text-center space-y-6">

      {state === "loading" && (
        <>
          <Loader2 size={64} className="animate-spin text-slate-400 mx-auto" />
          <p className="text-slate-600 font-bold">Confirming your payment...</p>
        </>
      )}

      {state === "success" && (
        <>
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto" />
          <div>
            <h1 className="text-3xl font-black text-slate-900">Order Confirmed!</h1>
            {orderId && (
              <p className="text-sm text-slate-500 mt-1 font-mono">
                Order #{orderId.slice(-8).toUpperCase()}
              </p>
            )}
            <p className="mt-4 text-slate-600 text-sm leading-relaxed">{message}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/shop"
              className="w-full rounded-xl bg-slate-900 py-3 font-black text-white hover:bg-slate-800 transition text-center"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="w-full rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50 transition text-sm text-center"
            >
              Back to Home
            </Link>
          </div>
        </>
      )}

      {state === "failed" && (
        <>
          <XCircle size={64} className="text-rose-500 mx-auto" />
          <div>
            <h1 className="text-3xl font-black text-slate-900">Payment Failed</h1>
            <p className="mt-4 text-slate-600 text-sm leading-relaxed">{message}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.back()}
              className="w-full rounded-xl bg-slate-900 py-3 font-black text-white hover:bg-slate-800 transition"
            >
              Try Again
            </button>
            <Link
              href="/shop"
              className="w-full rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50 transition text-sm text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </>
      )}

    </div>
  );
}

// ─── Page export wraps content in Suspense ────────────────────────────────────

export default function CheckoutConfirmPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="font-bold">Loading...</span>
          </div>
        }
      >
        <ConfirmContent />
      </Suspense>
    </main>
  );
}