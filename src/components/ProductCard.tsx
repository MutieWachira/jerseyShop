"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";

type ProductCardProps = {
    id: number;
  name: string;
  team: string;
  price: number;
  image: string; // Add this!
  description: string; // Match schema (it's not optional in prisma)
  categoryId: string;
};

export default function ProductCard({
  id,
  name,
  team,
  price,
  description,
  image,
  categoryId
}: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      
      {/* Clickable image + link to product detail */}
      <Link href={`/shop/${id}`} className="relative overflow-hidden rounded-2xl bg-slate-100 block">
        <div className="flex h-44 items-center justify-center text-sm font-extrabold text-slate-400">
          PRODUCT IMAGE
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900 shadow-sm">
          {team}
        </div>
      </Link>

      {/* Product Info */}
      <div className="mt-4">
        <h3 className="text-base font-extrabold text-slate-900">{name}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-extrabold text-slate-900">Ksh {price}</span>

          {/* Add to Cart */}
          <button
            onClick={() =>
              addToCart({
                id,
                name,
                price,
                quantity: 1,
              })
            }
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800"
          >
            Add
          </button>
        </div>

        {/* Optional “View Details” link */}
        <Link
          href={`/shop/${id}`}
          className="mt-2 block text-sm text-slate-500 hover:text-slate-900 font-semibold"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}