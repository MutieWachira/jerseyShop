"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";

type ProductCardProps = {
  id: number;
  name: string;
  team: string;
  price: number;
  image: string;
  description: string;
  categoryId: string;
};

export default function ProductCard({
  id,
  name,
  team,
  price,
  description,
  image,
  categoryId,
}: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="group flex flex-col h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      
      {/* Product Image Section */}
      <Link href={`/shop/${id}`} className="relative block overflow-hidden rounded-2xl aspect-[4/3] bg-slate-100">
        <img
          src={image || "/placeholder-jersey.png"} 
          alt={name}
          className="h-full w-full object-fit transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co";
          }}
        />
        
        {/* Team Badge */}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm border border-slate-100">
          {team}
        </div>
      </Link>

      {/* Product Info */}
      <div className="mt-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{name}</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[2.5rem]">
            {description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase">Price</span>
            <span className="text-lg font-black text-slate-900">Ksh {price.toLocaleString()}</span>
          </div>

          <button
            onClick={() =>
              addToCart({
                id,
                name,
                price,
                quantity: 1,
              })
            }
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-tight text-white transition hover:bg-slate-700 active:scale-95 shadow-sm"
          >
            Add to Cart
          </button>
        </div>

        <Link
          href={`/shop/${id}`}
          className="mt-4 text-center py-2 rounded-xl text-xs font-bold text-slate-400 border border-transparent hover:border-slate-100 hover:text-slate-900 transition-all"
        >
          View Full Details
        </Link>
      </div>
    </div>
  );
}
