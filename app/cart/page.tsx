"use client";

import Link from "next/link";
import { useCart } from "@/src/context/CartContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const totalPrice = (cart ?? []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = (cart ?? []).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (!cart || cart.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            Your Cart
          </h1>

          <p className="text-slate-600 mb-8">
            Your cart is currently empty.
          </p>

          <Link
            href="/shop"
            className="inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">

        <h1 className="text-3xl font-bold text-slate-900 mb-10">
          Shopping Cart
        </h1>

        <div className="grid gap-10 md:grid-cols-3">

          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4 rounded-xl">

            {cart.map((item) => (
              <div
                key={`${item.id}-${item.size}-${item.version}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-500 p-4"
              >

                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                  className="h-24 w-24 rounded-xl object-cover"
                />

                <div className="flex-1">

                  <h2 className="font-semibold text-slate-900">
                    {item.name}
                  </h2>

                  {/* New: Version */}
                  {item.version && (
                    <p className="text-xs text-slate-500">
                      Version: {item.version}
                    </p>
                  )}

                  {/* New: Size */}
                  {item.size && (
                    <p className="text-xs text-slate-500">
                      Size: {item.size}
                    </p>
                  )}

                  <p className="text-sm text-slate-500 mt-1">
                    Ksh {item.price.toLocaleString()}
                  </p>

                  <div className="mt-3 flex items-center gap-3">

                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.size, item.version, item.quantity - 1)
                      }
                      className="h-8 w-8 rounded-md text-slate-500 border border-slate-500 hover:bg-slate-100"
                    >
                      -
                    </button>

                    <span className="text-sm font-semibold text-slate-500">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.size, item.version, item.quantity + 1)
                      }
                      className="h-8 w-8 rounded-md text-slate-500 border border-slate-500 hover:bg-slate-100"
                    >
                      +
                    </button>

                  </div>

                </div>

                <button
                  onClick={() => removeFromCart(item.id, item.size, item.version)}
                  className="text-sm font-semibold text-red-500 hover:underline"
                >
                  Remove
                </button>

              </div>
            ))}

          </div>

          {/* Summary */}
          <div className="h-fit rounded-2xl border border-slate-500 p-6">

            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Order Summary
            </h2>

            <div className="flex justify-between text-sm mb-3">
              <span className="text-slate-600">Items</span>
              <span className="font-semibold">{totalItems}</span>
            </div>

            <div className="flex justify-between text-sm mb-6">
              <span className="text-slate-600">Total</span>
              <span className="font-bold text-slate-900">
                Ksh {totalPrice.toLocaleString()}
              </span>
            </div>

            <Link
              href="/checkout"
              className="block w-full rounded-xl bg-slate-900 py-3 text-center font-semibold text-white hover:bg-slate-800"
            >
              Proceed to Checkout
            </Link>

          </div>

        </div>
      </div>
    </main>
  );
}