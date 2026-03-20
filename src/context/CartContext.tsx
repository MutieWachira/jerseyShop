"use client";

import { createContext, useContext, useState } from "react";

export type CompetitionBadge =
  | "PREMIER_LEAGUE"
  | "CHAMPIONS_LEAGUE"
  | "EUROPA_LEAGUE"
  | "FA_CUP"
  | "SERIE_A"
  | "LA_LIGA"
  | "BUNDESLIGA"
  | "LIGUE_1"
  | "NONE";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  version?: string;
  image?: string;
  variantId?: string;        // needed for order submission
  // Jersey customisation
  competitionBadge?: CompetitionBadge;
  playerName?: string;
  playerNumber?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number, size?: string, version?: string) => void;
  updateQuantity: (id: number, size: string | undefined, version: string | undefined, quantity: number) => void;
  updateCustomisation: (
    id: number,
    size: string | undefined,
    version: string | undefined,
    customisation: {
      competitionBadge: CompetitionBadge;
      playerName: string;
      playerNumber: string;
    }
  ) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addToCart(item: CartItem) {
    setCart((prev) => {
      const existing = prev.find(
        (p) =>
          p.id === item.id &&
          p.size === item.size &&
          p.version === item.version
      );
      if (existing) {
        return prev.map((p) =>
          p.id === item.id &&
          p.size === item.size &&
          p.version === item.version
            ? { ...p, quantity: p.quantity + item.quantity }
            : p
        );
      }
      return [...prev, item];
    });
  }

  function removeFromCart(id: number, size?: string, version?: string) {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.id === id && item.size === size && item.version === version)
      )
    );
  }

  function updateQuantity(
    id: number,
    size: string | undefined,
    version: string | undefined,
    quantity: number
  ) {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === Number(id) &&
        item.size === size &&
        item.version === version
          ? { ...item, quantity }
          : item
      )
    );
  }

  function updateCustomisation(
    id: number,
    size: string | undefined,
    version: string | undefined,
    customisation: {
      competitionBadge: CompetitionBadge;
      playerName: string;
      playerNumber: string;
    }
  ) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id &&
        item.size === size &&
        item.version === version
          ? { ...item, ...customisation }
          : item
      )
    );
  }

  // Clears cart after successful order
  function clearCart() {
    setCart([]);
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, updateCustomisation, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}