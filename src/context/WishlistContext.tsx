"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const WishlistContext = createContext<any>({
  wishlist: [],
  toggleWishlist: () => {},
  isInWishlist: () => false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // ✅ Added to track hydration

  // ✅ Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("userWishlist");
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // ✅ Only persist to localStorage AFTER initial load to avoid wiping data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("userWishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded]);

  const toggleWishlist = (item: any) => {
    // ✅ Auth Gate: Force redirect if not logged in
    if (!session) {
      router.push("/login?callbackUrl=" + window.location.pathname);
      return;
    }

    setWishlist((prev) => {
      const exists = prev.find((i: any) => String(i.id) === String(item.id));
      return exists 
        ? prev.filter((i: any) => String(i.id) !== String(item.id)) 
        : [...prev, item];
    });
  };

  const isInWishlist = (id: any) => {
    // ✅ Safe check for session-based visibility
    if (!session) return false;
    return wishlist.some((item: any) => String(item.id) === String(id));
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
