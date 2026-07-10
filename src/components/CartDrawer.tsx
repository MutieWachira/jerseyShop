"use client";

import { Award } from "lucide-react";
// Image utilities are now used in the dedicated CartItemImage component
import CartItemImage from "./CartItemImage";
import Link from "next/link";
import { useCart, CompetitionBadge } from "@/src/context/CartContext";

const BADGE_LABELS: Record<CompetitionBadge, string> = {
  NONE:              "No Badge",
  PREMIER_LEAGUE:    "Premier League",
  CHAMPIONS_LEAGUE:  "Champions League",
  EUROPA_LEAGUE:     "Europa League",
  FA_CUP:            "FA Cup",
  SERIE_A:           "Serie A",
  LA_LIGA:           "La Liga",
  BUNDESLIGA:        "Bundesliga",
  LIGUE_1:           "Ligue 1",
};

const BADGE_COLORS: Record<CompetitionBadge, string> = {
  NONE:              "bg-slate-100   text-slate-500",
  PREMIER_LEAGUE:    "bg-purple-100  text-purple-700",
  CHAMPIONS_LEAGUE:  "bg-blue-100    text-blue-700",
  EUROPA_LEAGUE:     "bg-orange-100  text-orange-700",
  FA_CUP:            "bg-red-100     text-red-700",
  SERIE_A:           "bg-sky-100     text-sky-700",
  LA_LIGA:           "bg-rose-100    text-rose-700",
  BUNDESLIGA:        "bg-red-100     text-red-800",
  LIGUE_1:           "bg-indigo-100  text-indigo-700",
};

export default function CartDrawer() {
  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();

  const total = (cart ?? []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-80 overflow-y-auto bg-white shadow-lg p-6">

      <h2 className="text-xl font-black text-slate-900 mb-4">Your Cart</h2>

      {cart.length === 0 && (
        <p className="text-sm text-slate-500">Your cart is empty</p>
      )}

      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={`${item.id}-${item.size}-${item.version}`}
            className="rounded-2xl border border-slate-100 p-3"
          >
            <div className="flex justify-between gap-3">
                {/* Image thumbnail – use same logic as ProductCard */}
                <CartItemImage image={item.image} name={item.name} />
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">{item.name}</p>

                {/* Size + version */}
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {item.size && (
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {item.size}
                    </span>
                  )}
                  {item.version && (
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {item.version}
                    </span>
                  )}
                </div>

                {/* Customisation summary */}
                {(item.competitionBadge && item.competitionBadge !== "NONE") && (
                  <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${BADGE_COLORS[item.competitionBadge]}`}>
                    <Award size={9} />
                    {BADGE_LABELS[item.competitionBadge]}
                  </div>
                )}
                {(item.playerName || item.playerNumber) && (
                  <div className="mt-1 flex gap-1">
                    {item.playerNumber && (
                      <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">
                        #{item.playerNumber}
                      </span>
                    )}
                    {item.playerName && (
                      <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">
                        {item.playerName}
                      </span>
                    )}
                  </div>
                )}

                {/* Quantity controls */}
                <div className="flex gap-2 mt-2 items-center">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.size, item.version, item.quantity - 1)
                    }
                    className="h-6 w-6 rounded-lg bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-200 transition"
                  >
                    −
                  </button>
                  <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => addToCart({ ...item, quantity: 1 })}
                    className="h-6 w-6 rounded-lg bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-200 transition"
                  >
                    +
                  </button>
                </div>

                <p className="text-xs font-bold text-slate-500 mt-1">
                  Subtotal: Ksh {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-900">
                  Ksh {item.price.toLocaleString()}
                </p>
                <button
                  onClick={() => removeFromCart(item.id, item.size, item.version)}
                  className="text-rose-500 text-xs font-black mt-1 hover:text-rose-700 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
          <p className="font-black text-lg text-slate-900">
            Total: Ksh {total.toLocaleString()}
          </p>
          <Link
            href="/cart"
            className="block w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-black text-slate-700 hover:bg-slate-50 transition"
          >
            View Cart & Customise
          </Link>
          <Link
            href="/checkout"
            className="block w-full rounded-xl bg-slate-900 py-2.5 text-center text-sm font-black text-white hover:bg-slate-800 transition"
          >
            Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
