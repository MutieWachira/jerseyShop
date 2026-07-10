"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { normalizeProductImage, shouldRequestSignedImageUrl } from "@/src/lib/image";

interface SlideProduct {
  id: number;
  name: string;
  team: string;
  price: number;
  image: string;
}

// Inject the keyframe once into the document head — avoids styled-jsx hydration mismatch
function useProgressAnimation() {
  useEffect(() => {
    const id = "hero-progress-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes hero-progress {
        from { width: 0%; }
        to   { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }, []);
}

export default function HeroSlideshow({ products }: { products: SlideProduct[] }) {
  const slideIntervalMs = 20000;
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [resolvedImages, setResolvedImages] = useState<Record<number, string>>({});

  useProgressAnimation();

  const total = products.length;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  // Auto-advance every 20 seconds unless hovered
  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(next, slideIntervalMs);
    return () => clearInterval(t);
  }, [paused, next, total, slideIntervalMs]);

  const currentProduct = products[current];
  const currentImage = currentProduct?.image;

  const imageUrl = useMemo(() => {
    if (!currentProduct) return "/placeholder-jersey.png";

    const cachedUrl = resolvedImages[currentProduct.id];
    if (cachedUrl) return cachedUrl;

    if (!currentImage) return "/placeholder-jersey.png";
    if (!shouldRequestSignedImageUrl(currentImage)) {
      return normalizeProductImage(currentImage) || "/placeholder-jersey.png";
    }

    return "/placeholder-jersey.png";
  }, [currentProduct, currentImage, resolvedImages]);

  useEffect(() => {
    if (!currentProduct?.image || !shouldRequestSignedImageUrl(currentImage) || resolvedImages[currentProduct.id]) {
      return;
    }

    let isMounted = true;

    const resolveImage = async () => {
      try {
        const res = await fetch(`/api/images?key=${encodeURIComponent(currentImage)}`);
        const data = await res.json();
        const resolvedUrl = data.url || "/placeholder-jersey.png";
        if (isMounted) {
          setResolvedImages((prev) => ({ ...prev, [currentProduct.id]: resolvedUrl }));
        }
      } catch {
        if (isMounted) {
          setResolvedImages((prev) => ({ ...prev, [currentProduct.id]: "/placeholder-jersey.png" }));
        }
      }
    };

    resolveImage();
    return () => {
      isMounted = false;
    };
  }, [currentProduct, currentImage, resolvedImages]);

  useEffect(() => {
    const nextProducts = products.slice(current, current + 2);

    nextProducts.forEach((product) => {
      if (!product.image || !shouldRequestSignedImageUrl(product.image) || resolvedImages[product.id]) {
        return;
      }

      void fetch(`/api/images?key=${encodeURIComponent(product.image)}`)
        .then(async (res) => {
          const data = await res.json();
          const resolvedUrl = data.url || "/placeholder-jersey.png";
          setResolvedImages((prev) => ({ ...prev, [product.id]: resolvedUrl }));
        })
        .catch(() => undefined);
    });
  }, [current, products, resolvedImages]);

  if (total === 0) return null;

  const product = currentProduct;

  return (
    <div
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
              Featured Drop
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight leading-tight">
              Retro Club Collection
            </h2>
          </div>

          {/* Dot indicators */}
          {total > 1 && (
            <div className="flex gap-1.5 mt-1">
              {products.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-5 h-2 bg-white"
                      : "w-2 h-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Jersey image */}
        <div className="relative rounded-3xl bg-white/10 backdrop-blur overflow-hidden aspect-[4/3]">
          <Link href={`/shop/${product.id}`}>
            {product.image ? (
              <Image
                key={product.id}
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-opacity duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={85}
                priority
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlMmU4ZTgiLz48L3N2Zz4="
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm">
                No Image
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="bg-white text-slate-900 text-xs font-black px-4 py-2 rounded-full shadow-lg">
                View Jersey
              </span>
            </div>
          </Link>

          {/* Team badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
            {product.team}
          </div>
        </div>

        {/* Product info + nav */}
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base font-black text-white truncate">{product.name}</p>
            <p className="text-sm font-bold text-slate-300 mt-0.5">
              Ksh {product.price.toLocaleString()}
            </p>
          </div>

          {total > 1 && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={prev}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
              <button
                onClick={next}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <ChevronRight size={16} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Progress bar — inline style avoids styled-jsx hydration issues */}
        {total > 1 && !paused && (
          <div className="mt-4 h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div
              key={current}
              className="h-full bg-white/50 rounded-full"
              style={{ animation: `hero-progress ${slideIntervalMs}ms linear forwards` }}
            />
          </div>
        )}

      </div>

      {/* Trending pill */}
      <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-md sm:block">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trending Now</p>
        <p className="mt-1 text-sm font-extrabold text-slate-900">
          {[...new Set(products.map((p) => p.team))].slice(0, 3).join(" · ")}
        </p>
      </div>
    </div>
  );
}