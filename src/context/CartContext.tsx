"use client";

import { createContext, useContext, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  version?: string;
  image?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number, size?: string, version?: string) => void;
  updateQuantity: (id: string, size: string | undefined, version: string | undefined, quantity: number) => void;
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
          !(
            item.id === id &&
            item.size === size &&
            item.version === version
          )
      )
    );
  }

  function updateQuantity(
    id: string,
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

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity }}
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