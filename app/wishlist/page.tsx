"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/src/context/WishlistContext";

export default function WishlistPage() {
  // ✅ 1. Standard NextAuth protection logic
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login?callbackUrl=/wishlist");
    },
  });

  const { wishlist, toggleWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);

  // ✅ 2. Prevent Hydration Mismatch (Wait for client-side mount)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ 3. Handle Loading State (Prevents the "Empty Wishlist" flash while checking session)
  if (status === "loading" || !mounted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Wishlist</p>
        </div>
      </main>
    );
  }

  // ✅ 4. Empty State
  if (wishlist.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
            <svg xmlns="http://w3.org" className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your wishlist is empty</h1>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto">Save your favorite jerseys to see them here and access them from any device.</p>
          <Link 
            href="/shop" 
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 inline-block"
          >
            Browse Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Account</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              My Wishlist <span className="text-slate-300 ml-2">({wishlist.length})</span>
            </h1>
          </div>
          <Link href="/shop" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">
            Continue Shopping →
          </Link>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist.map((item: { id: string; image: string; name: string; price: number }) => (
            <div 
              key={item.id} 
              className="relative group rounded-[2.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
            >
              <Link href={`/shop/${item.id}`}>
                <div className="relative aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-slate-50">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
              
              <div className="mt-6 px-1">
                <h3 className="font-bold text-slate-900 text-lg line-clamp-1 group-hover:text-slate-700 transition-colors">{item.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Price</span>
                      <span className="text-xl font-black text-slate-900">Ksh {item.price.toLocaleString()}</span>
                   </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => toggleWishlist(item)}
                    className="flex-[0.4] py-3 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition active:scale-95"
                  >
                    Remove
                  </button>
                  <Link
                    href={`/shop/${item.id}`}
                    className="flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition active:scale-95 shadow-md shadow-slate-100"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
