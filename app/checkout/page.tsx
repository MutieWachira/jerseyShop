"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useCart } from "@/src/context/CartContext";
import { useCheckout } from "@/src/hooks/useCheckout";
import { Loader2, CheckCircle2, FileText, Smartphone, CreditCard, X, Plus, Minus } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveProductImageUrl, normalizeProductImage } from "@/src/lib/image";

export default function ProductionCheckoutPage() {
  const { cart, clearCart, updateQuantity, removeFromCart } = useCart();
  const { initiateCheckoutProcess, loading: checkoutLoading, error: checkoutError } = useCheckout();
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [step, setStep] = useState<"shipping" | "payment" | "processing" | "success">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>("");
  const pollingRef = useRef<number | null>(null);

  const [shipping, setShipping] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const [resolvedImages, setResolvedImages] = useState<Record<string,string>>({});

  // card fields (note: for production integrate a hosted field/tokenization)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  useEffect(() => {
    let mounted = true;
    async function resolveAll() {
      const map: Record<string,string> = {};
      await Promise.all((cart||[]).map(async (item:any) => {
        try {
          const url = await resolveProductImageUrl(item.image, '/uploads/placeholder.png');
          map[item.variantId || item.id] = url || normalizeProductImage(item.image) || '/uploads/placeholder.png';
        } catch {
          map[item.variantId || item.id] = normalizeProductImage(item.image) || '/uploads/placeholder.png';
        }
      }));
      if (mounted) setResolvedImages(map);
    }
    resolveAll();
    return () => { mounted = false; };
  }, [cart]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const customisationTotal = useMemo(() => cart.reduce((sum, item) => {
    return sum +
      (item.competitionBadge && item.competitionBadge !== "NONE" ? 200 : 0) +
      (item.playerName ? 100 : 0) +
      (item.playerNumber ? 100 : 0);
  }, 0), [cart]);
  const shippingCost = 0; // Shipping is free
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = Math.max(0, subtotal + customisationTotal + shippingCost - discountAmount);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, []);

  async function startOrderStatusPolling(orderId: string, checkoutRequestId: string) {
    setPaymentStatus("pending");
    setOrderError(null);

    let shouldContinuePolling = true;
    let queryAttempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to fetch order status");
        }

        if (data.order?.status === "PAID") {
          shouldContinuePolling = false;
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setPaymentStatus("paid");
          clearCart();
          setStep("success");
          return;
        }

        if (data.order?.status === "FAILED") {
          shouldContinuePolling = false;
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setPaymentStatus("failed");
          setOrderError("Your payment could not be verified. Please try again or contact support.");
          return;
        }

        if (checkoutRequestId && queryAttempts >= 1) {
          // If the order still shows pending, check M-Pesa directly after a couple of polls.
          const queryRes = await fetch("/api/payments/mpesa/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkoutRequestId }),
          });
          const queryData = await queryRes.json();
          if (queryRes.ok) {
            if (queryData.paid) {
              setOrderError(
                "Payment was received by M-Pesa. Waiting for our system to update the order status."
              );
            } else if (queryData.cancelled) {
              shouldContinuePolling = false;
              if (pollingRef.current) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setPaymentStatus("failed");
              setOrderError("Payment was cancelled from M-Pesa. Please try again.");
              return;
            } else {
              setOrderError(
                "Payment is still pending with M-Pesa. Please confirm your transaction on your phone."
              );
            }
          }
        }

        queryAttempts += 1;
      } catch (err: any) {
        console.error("Order status poll failed:", err);
      }
    };

    await checkStatus();
    if (shouldContinuePolling) {
      pollingRef.current = window.setInterval(checkStatus, 4000);
    }
  }

  function formatCurrency(amount: number) {
    try { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount); }
    catch { return `Ksh ${amount.toFixed(2)}`; }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipping(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const requireAuthOrPrompt = () => {
    if (!session) {
      // redirect to login with callback
      signIn(undefined, { callbackUrl: pathname });
      return false;
    }
    return true;
  };

  const executePaymentSubmit = async () => {
    if (!requireAuthOrPrompt()) return;
    const discountPayload = appliedCoupon ? { code: appliedCoupon.code } : null;
    const paymentDetails = paymentMethod === 'card' ? { cardName, cardNumber, cardExpiry, cardCVC } : null;
    const mpesaPhone = paymentMethod === 'mpesa' ? shipping.phone : undefined;
    const result = await initiateCheckoutProcess(
      shipping,
      discountPayload,
      paymentMethod,
      mpesaPhone,
      paymentDetails,
      shippingCost
    );
    if (result) {
      setConfirmedOrderId(result.orderId);
      setCheckoutRequestId(result.paymentData?.checkoutRequestId || "");
      if (!result.paymentRequired) {
        clearCart();
        setStep("success");
        return;
      }

      if (paymentMethod === "card") {
        const paymentUrl = result.paymentData?.paymentUrl;
        if (!paymentUrl) {
          setOrderError("Unable to start card payment. Please try again.");
          return;
        }
        window.location.href = paymentUrl;
      } else {
        setStep("processing");
        startOrderStatusPolling(result.orderId, result.paymentData?.checkoutRequestId || "");
      }
    }
  };

  if (step === "processing") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-6 shadow-sm">
          <Loader2 size={56} className="text-slate-400 mx-auto animate-spin" />
          <div>
            <h2 className="text-2xl font-black text-slate-900">Waiting for payment confirmation</h2>
            <p className="text-sm text-slate-500 mt-2">
              Your M-Pesa request has been sent. Confirm the payment on your phone and the order will be completed once the transaction is verified.
            </p>
            {confirmedOrderId ? (
              <p className="mt-3 text-xs text-slate-400 font-mono">Order ID: {confirmedOrderId}</p>
            ) : null}
            {orderError ? (
              <p className="mt-4 text-sm text-rose-600">{orderError}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/orders" className="w-full rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50 transition text-sm text-center">
              View My Orders
            </Link>
            <Link href="/shop" className="w-full rounded-xl bg-slate-900 py-3 font-black text-white hover:bg-slate-800 transition text-center">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (step === "success") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-6 shadow-sm">
          <CheckCircle2 size={56} className="text-emerald-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-black text-slate-900">Order Confirmed!</h2>
            <p className="text-sm text-slate-500 mt-2">Thanks — your order is on the way. A copy of your receipt will be emailed to you shortly.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <FileText className="text-slate-700" size={24} />
              <div>
                <p className="text-xs font-bold text-slate-400 font-mono">ID: {confirmedOrderId.slice(0,8).toUpperCase()}</p>
                <p className="text-sm font-black text-slate-800">Payment Invoice Receipt</p>
              </div>
            </div>
            <a 
              href={`/api/orders/${confirmedOrderId}/download-receipt`}
              className="text-xs font-black bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl transition"
            >
              Download
            </a>
          </div>
          <Link href="/shop" className="inline-block mt-2 text-sm text-slate-700 hover:underline">Continue shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-12 px-4 mx-auto text-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-500 mt-1">Complete your purchase — secure checkout with multiple payment channels.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm text-slate-900">
            <h2 className="text-lg font-black text-slate-900">Delivery Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 ">
              <input name="name" placeholder="Full Name" value={shipping.name} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              <input name="email" type="email" placeholder="Email Address" value={shipping.email} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              <input name="phone" placeholder="Phone Number" value={shipping.phone} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              <input name="city" placeholder="City" value={shipping.city} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              <input name="address" placeholder="Street Address" value={shipping.address} onChange={handleInputChange} className="md:col-span-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input value={coupon} onChange={(e)=>setCoupon(e.target.value)} placeholder="Discount code (optional)" className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
              <button onClick={async ()=>{
                setCouponMsg(null);
                if (!coupon || coupon.trim().length===0) { setCouponMsg('Enter a discount code'); return; }
                try {
                  const res = await fetch('/api/discounts/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: coupon.trim(), cartTotal: subtotal + customisationTotal + shippingCost }) });
                  const data = await res.json();
                  if (!res.ok) { setCouponMsg(data.error || 'Invalid code'); setAppliedCoupon(null); return; }
                  setAppliedCoupon(data);
                  setCouponMsg(data.message || 'Discount applied');
                } catch (err:any) { setCouponMsg('Unable to validate code'); }
              }} className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">Apply</button>
            </div>
            {couponMsg ? <p className="mt-2 text-sm text-slate-600">{couponMsg}</p> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <button onClick={()=>setPaymentMethod('mpesa')} className={`p-4 border rounded-2xl text-left flex items-center gap-3 ${paymentMethod==='mpesa' ? 'border-slate-900 bg-slate-50' : ''}`}>
                <Smartphone size={20} /> <div><p className="font-black text-sm">M-Pesa</p><p className="text-xs text-slate-500">Mobile money (fast)</p></div>
              </button>
              <button onClick={()=>setPaymentMethod('card')} className={`p-4 border rounded-2xl text-left flex items-center gap-3 ${paymentMethod==='card' ? 'border-slate-900 bg-slate-50' : ''}`}>
                <CreditCard size={20} /> <div><p className="font-black text-sm">Card</p><p className="text-xs text-slate-500">Credit or debit via gateway</p></div>
              </button>
            </div>

            <div className="mt-6">
              {!session ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                  You are not signed in. <button onClick={()=>signIn(undefined, { callbackUrl: pathname })} className="font-bold underline">Sign in</button> to complete the checkout.
                </div>
              ) : (
                <div className="text-sm text-slate-600">Signed in as <strong>{session.user?.email}</strong></div>
              )}
            </div>

            <div className="mt-4">
              {paymentMethod === 'mpesa' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input name="mpesaPhone" placeholder="M-Pesa phone (+2547XXXXXXXX)" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" onChange={(e)=>setShipping(prev=>({ ...prev, phone: e.target.value }))} value={shipping.phone} />
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  <input name="cardName" placeholder="Name on card" value={cardName} onChange={(e)=>setCardName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
                  <input name="cardNumber" placeholder="Card number" value={cardNumber} onChange={(e)=>setCardNumber(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="cardExpiry" placeholder="MM/YY" value={cardExpiry} onChange={(e)=>setCardExpiry(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
                    <input name="cardCVC" placeholder="CVC" value={cardCVC} onChange={(e)=>setCardCVC(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Card details are transmitted securely to the payment gateway. Do not store raw card data on this server to remain PCI compliant.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button disabled={checkoutLoading} onClick={executePaymentSubmit} className="flex-1 bg-emerald-600 text-white rounded-xl py-3 font-black hover:bg-emerald-500 disabled:opacity-60 flex items-center justify-center gap-2">
                {checkoutLoading ? <Loader2 className="animate-spin" size={16} /> : 'Place Order'}
              </button>
              <button onClick={()=>setStep('shipping')} className="rounded-xl border px-4 py-3">Save</button>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-black">Order Summary</h3>
          <div className="mt-4 space-y-4">
            {(cart && cart.length>0) ? cart.map((item:any)=> (
              <div key={item.variantId || item.id} className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                  <img src={resolvedImages[item.variantId || item.id] || normalizeProductImage(item.image) || '/uploads/placeholder.png'} alt={item.name} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-sm font-medium">Ksh {(item.price).toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-slate-500">{item.size} • {item.version}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={()=>updateQuantity(item.id, item.size, item.version, Math.max(1, item.quantity-1))} className="p-1 rounded-md border"><Minus size={14} /></button>
                    <div className="px-3 py-1 rounded-xl border">{item.quantity}</div>
                    <button onClick={()=>updateQuantity(item.id, item.size, item.version, item.quantity+1)} className="p-1 rounded-md border"><Plus size={14} /></button>
                    <button onClick={()=>removeFromCart(item.id, item.size, item.version)} className="ml-auto text-rose-600 text-sm">Remove</button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">Your cart is empty.</div>
            )}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Customisation</span><span className="font-bold">{customisationTotal > 0 ? formatCurrency(customisationTotal) : "Ksh 0"}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>
            <div className="flex justify-between text-lg font-black"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
          </div>
        </aside>
      </div>
      {checkoutError && <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{checkoutError}</div>}
    </main>
  );
}