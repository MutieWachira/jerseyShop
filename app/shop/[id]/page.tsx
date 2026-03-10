"use client";

import { useState, use } from "react"; // 1. Added 'use' hook
import { useCart } from "@/src/context/CartContext";

type Product = {
  id: string;
  name: string;
  team: string;
  price: number;
  description: string;
};

const products: Product[] = [
  {
    id: "1",
    name: "Arsenal Home Jersey 2026",
    team: "Arsenal",
    price: 3500,
    description: "Premium supporters edition jersey for Arsenal 2026 season.",
  },
  {
    id: "2",
    name: "Liverpool Away Jersey 2026",
    team: "Liverpool",
    price: 3600,
    description: "High quality away jersey for Liverpool fans.",
  },
];

interface Props {
  params: Promise<{ id: string }>; // 2. Changed to Promise
}

export default function ProductDetailPage({ params }: Props) {
  // 3. Unwrap the params using the 'use' hook
  const { id } = use(params); 
  
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // 4. Use the unwrapped 'id' to find the product
  const product = products.find((p) => p.id === id);

  if (!product) { 
    return (
      <div className="p-6 text-center text-red-500">
        Product not found
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 flex flex-col md:flex-row gap-8">
      {/* Product Image */}
      <div className="flex-1 bg-slate-100 rounded-2xl h-80 flex items-center justify-center">
        <span className="text-slate-400 font-bold">PRODUCT IMAGE</span>
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900">{product.name}</h1>
        <p className="text-sm text-gray-500">{product.team}</p>
        <p className="text-slate-700">{product.description}</p>

        <p className="text-2xl font-bold text-slate-900 mt-4">Ksh {product.price.toLocaleString()}</p>

        {/* Quantity Selector */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
          >
            -
          </button>
          <span className="font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() =>
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              quantity,
            })
          }
          className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
        >
          Add to Cart
        </button>
      </div>
    </main>
  );
}