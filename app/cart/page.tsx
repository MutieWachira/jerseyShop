"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp, Award } from "lucide-react";
import { useCart, CartItem, CompetitionBadge } from "@/src/context/CartContext";

// ─── Pricing ──────────────────────────────────────────────────────────────────

const BADGE_PRICE  = 200; // competition patch on sleeve
const NAME_PRICE   = 100; // player name on back
const NUMBER_PRICE = 100; // shirt number on back

/** Calculate customisation surcharge for a single cart item */
function getCustomisationCost(item: CartItem): number {
  let cost = 0;
  if (item.competitionBadge && item.competitionBadge !== "NONE") cost += BADGE_PRICE;
  if (item.playerName)   cost += NAME_PRICE;
  if (item.playerNumber) cost += NUMBER_PRICE;
  return cost;
}

// ─── Competition Badge Options ────────────────────────────────────────────────

const COMPETITION_BADGES: {
  value: CompetitionBadge;
  label: string;
  pill: string;
  dot: string;
}[] = [
  { value: "NONE",             label: "No Badge",         pill: "bg-slate-100 text-slate-500 border-slate-200",   dot: "bg-slate-300" },
  { value: "PREMIER_LEAGUE",   label: "Premier League",   pill: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-600" },
  { value: "CHAMPIONS_LEAGUE", label: "Champions League", pill: "bg-blue-50   text-blue-700   border-blue-200",   dot: "bg-blue-600" },
  { value: "EUROPA_LEAGUE",    label: "Europa League",    pill: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  { value: "FA_CUP",           label: "FA Cup",           pill: "bg-red-50    text-red-700    border-red-200",    dot: "bg-red-600" },
  { value: "SERIE_A",          label: "Serie A",          pill: "bg-sky-50    text-sky-700    border-sky-200",    dot: "bg-sky-600" },
  { value: "LA_LIGA",          label: "La Liga",          pill: "bg-rose-50   text-rose-700   border-rose-200",   dot: "bg-rose-600" },
  { value: "BUNDESLIGA",       label: "Bundesliga",       pill: "bg-red-50    text-red-800    border-red-200",    dot: "bg-red-700" },
  { value: "LIGUE_1",          label: "Ligue 1",          pill: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-600" },
];

function getBadge(value: CompetitionBadge) {
  return COMPETITION_BADGES.find((b) => b.value === value) ?? COMPETITION_BADGES[0];
}

// ─── Customisation Editor ─────────────────────────────────────────────────────

function CustomisationEditor({ item }: { item: CartItem }) {
  const { updateCustomisation } = useCart();

  const [open,         setOpen]         = useState(false);
  const [badge,        setBadge]        = useState<CompetitionBadge>(item.competitionBadge || "NONE");
  const [playerName,   setPlayerName]   = useState(item.playerName   || "");
  const [playerNumber, setPlayerNumber] = useState(item.playerNumber || "");
  const [saved,        setSaved]        = useState(false);

  const hasCustomisation =
    (item.competitionBadge && item.competitionBadge !== "NONE") ||
    item.playerName ||
    item.playerNumber;

  // Live cost preview inside the editor (before saving)
  const previewCost =
    (badge !== "NONE" ? BADGE_PRICE : 0) +
    (playerName.trim()   ? NAME_PRICE   : 0) +
    (playerNumber.trim() ? NUMBER_PRICE : 0);

  const handleSave = () => {
    updateCustomisation(item.id, item.size, item.version, {
      competitionBadge: badge,
      playerName:       playerName.toUpperCase().trim(),
      playerNumber:     playerNumber.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setBadge("NONE");
    setPlayerName("");
    setPlayerNumber("");
    updateCustomisation(item.id, item.size, item.version, {
      competitionBadge: "NONE",
      playerName:       "",
      playerNumber:     "",
    });
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">

      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Award size={14} className="text-slate-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">
            {hasCustomisation ? "Customisation Added ✓" : "Customise Jersey"}
          </span>

          {/* Summary chips when collapsed */}
          {!open && hasCustomisation && (
            <div className="flex gap-1.5 flex-wrap">
              {item.competitionBadge && item.competitionBadge !== "NONE" && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getBadge(item.competitionBadge).pill}`}>
                  {getBadge(item.competitionBadge).label}
                </span>
              )}
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
              {/* Saved cost chip */}
              {getCustomisationCost(item) > 0 && (
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  +Ksh {getCustomisationCost(item)}
                </span>
              )}
            </div>
          )}
        </div>
        {open
          ? <ChevronUp   size={14} className="text-slate-400 shrink-0" />
          : <ChevronDown size={14} className="text-slate-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 py-5 space-y-5 bg-white">

          {/* ── Pricing legend ── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Competition Badge", price: BADGE_PRICE },
              { label: "Player Name",       price: NAME_PRICE  },
              { label: "Shirt Number",      price: NUMBER_PRICE },
            ].map(({ label, price }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-400 leading-tight">{label}</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">+Ksh {price}</p>
              </div>
            ))}
          </div>

          {/* ── Competition Badge ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-slate-700">
                Competition Badge — Left Sleeve
              </label>
              <span className="text-[10px] font-black text-slate-400">+Ksh {BADGE_PRICE}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Select the patch to be printed on the left sleeve
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COMPETITION_BADGES.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => { setBadge(b.value); setSaved(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition text-left
                    ${badge === b.value
                      ? "ring-2 ring-offset-1 ring-slate-900 " + b.pill
                      : b.pill + " opacity-60 hover:opacity-100"
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${b.dot}`} />
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Name & Number ── */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wide text-slate-700">
              Name & Number — Back of Jersey
            </label>
            <p className="text-[10px] text-slate-400">
              Leave blank for no printing
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Player Name</label>
                  <span className="text-[10px] font-black text-slate-400">+Ksh {NAME_PRICE}</span>
                </div>
                <input
                  type="text"
                  maxLength={12}
                  value={playerName}
                  onChange={(e) => {
                    setSaved(false);
                    setPlayerName(e.target.value.toUpperCase());
                  }}
                  placeholder="e.g. SALAH"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 uppercase"
                />
                <p className="text-[10px] text-slate-400">{playerName.length}/12</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Shirt Number</label>
                  <span className="text-[10px] font-black text-slate-400">+Ksh {NUMBER_PRICE}</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={playerNumber}
                  onChange={(e) => {
                    setSaved(false);
                    setPlayerNumber(e.target.value);
                  }}
                  placeholder="e.g. 11"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>
          </div>

          {/* ── Live cost preview ── */}
          {previewCost > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-xs font-black text-emerald-700">Customisation cost</p>
              <p className="text-sm font-black text-emerald-700">+Ksh {previewCost.toLocaleString()}</p>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-slate-900 text-white py-2.5 text-xs font-black hover:bg-slate-800 transition"
            >
              {saved ? "Saved ✓" : "Save Customisation"}
            </button>
            {hasCustomisation && (
              <button
                onClick={handleClear}
                className="px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black hover:bg-rose-100 transition"
              >
                Clear
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const jerseyTotal = (cart ?? []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Customisation cost is per item (not multiplied by quantity — it's a one-time print fee)
  const customisationTotal = (cart ?? []).reduce(
    (sum, item) => sum + getCustomisationCost(item),
    0
  );

  const grandTotal = jerseyTotal + customisationTotal;

  const totalItems = (cart ?? []).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const customisedItems = cart.filter(
    (i) =>
      (i.competitionBadge && i.competitionBadge !== "NONE") ||
      i.playerName ||
      i.playerNumber
  ).length;

  if (!cart || cart.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Your Cart</h1>
          <p className="text-slate-600 mb-8">Your cart is currently empty.</p>
          <Link
            href="/shop"
            className="inline-block rounded-xl bg-slate-900 px-6 py-3 font-black text-white hover:bg-slate-800 transition"
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

        <h1 className="text-3xl font-black text-slate-900 mb-10">Shopping Cart</h1>

        <div className="grid gap-10 md:grid-cols-3">

          {/* ── Cart Items ── */}
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => {
              const itemCustomCost = getCustomisationCost(item);
              return (
                <div
                  key={`${item.id}-${item.size}-${item.version}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-4">

                    {/* Thumbnail */}
                    <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-bold">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="font-black text-slate-900">{item.name}</h2>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.version && (
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {item.version}
                          </span>
                        )}
                        {item.size && (
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            Size {item.size}
                          </span>
                        )}
                      </div>

                      {/* Item price + customisation cost */}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-slate-900">
                          Ksh {item.price.toLocaleString()}
                        </p>
                        {itemCustomCost > 0 && (
                          <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            +Ksh {itemCustomCost} customisation
                          </span>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.version, item.quantity - 1)
                          }
                          className="h-8 w-8 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-black flex items-center justify-center transition"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-black text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.version, item.quantity + 1)
                          }
                          className="h-8 w-8 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-black flex items-center justify-center transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id, item.size, item.version)}
                      className="text-xs font-black text-rose-500 hover:text-rose-700 shrink-0 transition"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Customisation editor */}
                  <CustomisationEditor item={item} />
                </div>
              );
            })}
          </div>

          {/* ── Order Summary ── */}
          <div className="h-fit space-y-4">

            <div className="rounded-2xl border border-slate-200 p-6 text-slate-900">
              <h2 className="text-xl font-black text-slate-900 mb-6">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Items ({totalItems})</span>
                  <span className="font-bold">Ksh {jerseyTotal.toLocaleString()}</span>
                </div>

                {/* Customisation line items */}
                {cart.map((item) => {
                  const cost = getCustomisationCost(item);
                  if (!cost) return null;
                  return (
                    <div key={`custom-${item.id}-${item.size}-${item.version}`} className="flex justify-between text-xs">
                      <span className="text-slate-400 truncate max-w-[160px]">
                        {item.name} customisation
                      </span>
                      <span className="font-bold text-slate-600 shrink-0 ml-2">
                        +Ksh {cost}
                      </span>
                    </div>
                  );
                })}

                {customisationTotal > 0 && (
                  <div className="flex justify-between text-sm border-t border-slate-100 pt-3">
                    <span className="text-slate-500">Customisation total</span>
                    <span className="font-bold text-emerald-700">
                      +Ksh {customisationTotal.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-black text-slate-900">Total</span>
                  <span className="font-black text-slate-900">
                    Ksh {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-xl bg-slate-900 py-3 text-center font-black text-white hover:bg-slate-800 transition"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/shop"
                className="mt-3 block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}