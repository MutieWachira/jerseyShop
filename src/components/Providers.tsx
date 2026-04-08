"use client";

import React, { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/src/context/CartContext";
import { WishlistProvider } from "@/src/context/WishlistContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return SessionProvider immediately to avoid auth flickers, 
  // but wrap others in a fragment to keep the tree stable.
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
