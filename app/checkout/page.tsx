"use client";

import { useState } from "react";
import { useCart } from "@/src/context/CartContext";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { cart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const totalPrice = (cart ?? []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    // simulate order placement
    alert("Order placed successfully!");
    router.push("/shop");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Customer Form */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-2 space-y-4 rounded-2xl border border-slate-200 p-6 bg-white shadow-sm"
        >
          <h2 className="text-xl font-bold mb-4 text-slate-900">
            Shipping Information
          </h2>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            required
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <input
            type="text"
            name="address"
            placeholder="Delivery Address"
            required
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <input
            type="text"
            name="city"
            placeholder="City"
            required
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-2 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold transition hover:bg-slate-800"
          >
            Place Order
          </button>
        </form>

        {/* Order Summary */}
        <div className="rounded-2xl border border-slate-200 p-6 h-fit bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-900">
            Order Summary
          </h2>

          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between mb-2 text-sm text-slate-700"
            >
              <span>
                {item.name} x {item.quantity}
              </span>

              <span>Ksh {item.price * item.quantity}</span>
            </div>
          ))}

          <hr className="my-4" />

          <div className="flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span>Ksh {totalPrice}</span>
          </div>
        </div>
      </div>
    </main>
  );
}