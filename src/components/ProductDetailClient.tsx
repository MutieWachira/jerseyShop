"use client";

import { useState } from "react";
import { useCart } from "@/src/context/CartContext";

export default function ProductDetailClient({ product }: { product: any }) {
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const [version, setVersion] = useState("Fan");

  const sizes = ["S", "M", "L", "XL"];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="flex flex-col gap-10 rounded-2xl bg-white p-6 md:flex-row md:p-10 shadow-sm border">

          {/* Product Image */}
          <div className="flex-1 bg-slate-100 rounded-2xl h-80 flex items-center justify-center">
            <span className="text-slate-400 font-bold">PRODUCT IMAGE</span>
          </div>

          {/* Product Info */}
          <div className="flex flex-1 flex-col gap-4">

            <h1 className="text-3xl font-extrabold text-slate-900">
              {product.name}
            </h1>

            <p className="text-sm font-semibold text-slate-600">
              {product.team}
            </p>

            <p className="text-slate-700">
              {product.description}
            </p>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              Ksh {product.price.toLocaleString()}
            </p>

            {/* Jersey Version */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Jersey Version
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setVersion("Fan")}
                  className={`px-4 py-2 rounded-lg border ${
                    version === "Fan"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900"
                  }`}
                >
                  Fan
                </button>

                <button
                  onClick={() => setVersion("Player")}
                  className={`px-4 py-2 rounded-lg border ${
                    version === "Player"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900"
                  }`}
                >
                  Player
                </button>
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Select Size
              </p>

              <div className="flex gap-3">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-lg border font-semibold ${
                      size === s
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-900"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="rounded-lg bg-slate-900 px-3 py-1 font-semibold text-white"
              >
                -
              </button>

              <span className="font-semibold text-lg text-slate-900">
                {quantity}
              </span>

              <button
                onClick={() => setQuantity(quantity + 1)}
                className="rounded-lg bg-slate-900 px-3 py-1 font-semibold text-white"
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={() =>
                addToCart({
                  ...product,
                  quantity,
                  size,
                  version,
                })
              }
              className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Add to Cart
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}