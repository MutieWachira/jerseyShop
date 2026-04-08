"use client";

import React from "react";
import Link from "next/link";
import { useWishlist } from "@/src/context/WishlistContext";

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
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isFavourite = isInWishlist(id);

  return (
    <div className="group flex flex-col h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      
      {/* Product Image Section */}
      <Link href={`/shop/${id}`} className="relative block overflow-hidden rounded-2xl aspect-[4/3] bg-slate-100">
        <img
          src={image || "/placeholder-jersey.png"} 
          alt={name}
          className="h-full w-full object-fit transition-transform duration-500 group-hover:scale-110"
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

          {/* Wishlist Toggle Icon */}
          <button
            onClick={() => toggleWishlist({ id, name, price, image })}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90 ${
              isFavourite 
                ? "bg-red-50 text-red-500 shadow-inner" 
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
            aria-label="Toggle Wishlist"
          >
            <svg 
              xmlns="http://w3.org" 
              viewBox="0 0 24 24" 
              fill={isFavourite ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
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
