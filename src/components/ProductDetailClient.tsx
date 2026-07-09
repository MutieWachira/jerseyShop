"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/src/context/CartContext";
import { normalizeProductImage, shouldRequestSignedImageUrl } from "@/src/lib/image";

interface Variant {
  id: string;
  size: string;
  version: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  team: string;
  description: string;
  price: number;
  image: string;
  variants: Variant[];
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [imageUrl, setImageUrl] = useState(() => {
    if (!product.image) return "/placeholder-jersey.png";
    if (shouldRequestSignedImageUrl(product.image)) return "/placeholder-jersey.png";
    return normalizeProductImage(product.image) || "/placeholder-jersey.png";
  });

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      if (!product.image || !shouldRequestSignedImageUrl(product.image)) {
        if (isMounted) setImageUrl(normalizeProductImage(product.image) || "/placeholder-jersey.png");
        return;
      }

      try {
        const res = await fetch(`/api/images?key=${encodeURIComponent(product.image)}`);
        const data = await res.json();
        if (isMounted) setImageUrl(data.url || "/placeholder-jersey.png");
      } catch {
        if (isMounted) setImageUrl("/placeholder-jersey.png");
      }
    };

    resolveImage();
    return () => {
      isMounted = false;
    };
  }, [product.image]);

  const availableSizes    = [...new Set(product.variants.map((v) => v.size))];
  const availableVersions = [...new Set(product.variants.map((v) => v.version))];

  const [selectedSize,    setSelectedSize]    = useState(availableSizes[0]    || "");
  const [selectedVersion, setSelectedVersion] = useState(availableVersions[0] || "");
  const [quantity,        setQuantity]        = useState(1);

  const selectedVariant = product.variants.find(
    (v) => v.size === selectedSize && v.version === selectedVersion
  );

  const stock      = selectedVariant?.stock ?? 0;
  const outOfStock = stock === 0;
  const lowStock   = stock > 0 && stock <= 5;

  const sizeHasStock = (s: string) =>
    product.variants.some((v) => v.size === s && v.stock > 0);

  const versionHasStock = (ver: string) =>
    product.variants.some(
      (v) => v.size === selectedSize && v.version === ver && v.stock > 0
    );

  const handleAddToCart = () => {
    if (outOfStock || !selectedVariant) return;
    addToCart({
      id:        product.id,
      name:      product.name,
      price:     product.price,
      image:     product.image,
      quantity,
      size:      selectedSize,
      version:   selectedVersion,
      variantId: selectedVariant.id, // ← was missing — needed for order + stock check
    });
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 rounded-2xl bg-white p-6 shadow-sm border md:flex-row md:p-10">

          {/* ── Product Image ── */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-100 min-h-80">
            {product.image ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-slate-400 font-bold">No Image</span>
              </div>
            )}

            {outOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <span className="bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wide">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="flex flex-1 flex-col gap-4">

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {product.team}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
                {product.name}
              </h1>
            </div>

            <p className="text-slate-600 leading-relaxed text-sm">
              {product.description}
            </p>

            <p className="text-2xl font-black text-slate-900">
              Ksh {product.price.toLocaleString()}
            </p>

            {outOfStock ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-black text-rose-600">
                Out of Stock
              </span>
            ) : lowStock ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-black text-amber-600">
                Only {stock} left
              </span>
            ) : (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-600">
                In Stock
              </span>
            )}

            {/* Jersey Version */}
            {availableVersions.length > 0 && (
              <div>
                <p className="text-sm font-black text-slate-700 mb-2">Jersey Version</p>
                <div className="flex gap-2 flex-wrap">
                  {availableVersions.map((ver) => {
                    const hasStock  = versionHasStock(ver);
                    const isSelected = selectedVersion === ver;
                    return (
                      <button
                        key={ver}
                        onClick={() => hasStock && setSelectedVersion(ver)}
                        disabled={!hasStock}
                        className={`px-4 py-2 rounded-xl border text-sm font-bold transition ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900"
                            : hasStock
                            ? "bg-white text-slate-900 border-slate-200 hover:border-slate-400"
                            : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                        }`}
                      >
                        {ver}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {availableSizes.length > 0 && (
              <div>
                <p className="text-sm font-black text-slate-700 mb-2">Select Size</p>
                <div className="flex gap-2 flex-wrap">
                  {availableSizes.map((s) => {
                    const hasStock  = sizeHasStock(s);
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        onClick={() => hasStock && setSelectedSize(s)}
                        disabled={!hasStock}
                        className={`h-10 w-12 rounded-xl border text-sm font-bold transition ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900"
                            : hasStock
                            ? "bg-white text-slate-900 border-slate-200 hover:border-slate-400"
                            : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-black text-slate-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={outOfStock}
                  className="h-9 w-9 rounded-xl bg-slate-100 text-slate-900 font-black text-lg flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="w-8 text-center font-black text-lg text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={outOfStock || quantity >= stock}
                  className="h-9 w-9 rounded-xl bg-slate-100 text-slate-900 font-black text-lg flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || !selectedVariant}
              className="mt-4 w-full rounded-xl bg-slate-900 py-3.5 font-black text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}