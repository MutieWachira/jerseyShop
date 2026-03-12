"use client";

import { useCart } from "@/src/context/CartContext";

export default function CartDrawer() {

  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();

  const total = (cart ?? []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-80 overflow-y-auto bg-white shadow-lg p-6">

      <h2 className="text-xl font-bold mb-4">Your Cart</h2>

      {cart.length === 0 && (
        <p className="text-sm text-gray-500">Your cart is empty</p>
      )}

      {cart.map((item) => (
        <div key={item.id} className="flex justify-between mb-3">

          <div>
            <p className="font-semibold break-words">{item.name}</p>
            <div className="flex gap-2 mt-1 items-center">
              <button
                onClick={() => updateQuantity(String(item.id), item.size, item.version, item.quantity - 1)}
                className="px-2 py-1 bg-slate-200 rounded hover:bg-slate-300"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => addToCart(item)}
                className="px-2 py-1 bg-slate-200 rounded hover:bg-slate-300"
              >
                +
              </button>
            </div>
            {/* ✅ Per-item subtotal */}
            <p className="text-sm mt-1 text-gray-600">
              Subtotal: Ksh {(item.price * item.quantity).toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <p>Ksh {item.price.toLocaleString()}</p>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 text-xs mt-1"
            >
              Remove
            </button>
          </div>

        </div>
      ))}

      {cart.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <p className="font-bold text-lg">Total: Ksh {total.toLocaleString()}</p>
          <button className="mt-4 w-full bg-black text-white py-2 rounded-lg">
            Checkout
          </button>
        </div>
      )}

    </div>
  );
}