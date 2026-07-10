"use client";

import { useEffect, useState } from "react";
import {
  normalizeProductImage,
  resolveProductImageUrl,
  shouldRequestSignedImageUrl,
} from "@/src/lib/image";

/**
 * Renders a cart item thumbnail image.
 * Handles placeholder, unsigned URLs, and signed‑URL resolution via the shared image helpers.
 */
export default function CartItemImage({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const [imageUrl, setImageUrl] = useState<string>(() => {
    if (!image) return "/placeholder-jersey.png";
    // If the URL likely needs a signed request, fall back to placeholder until we resolve it.
    if (shouldRequestSignedImageUrl(image)) return "/placeholder-jersey.png";
    return normalizeProductImage(image) || "/placeholder-jersey.png";
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const resolved = await resolveProductImageUrl(image);
      if (mounted) setImageUrl(resolved);
    })();
    return () => {
      mounted = false;
    };
  }, [image]);

  return (
    <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-slate-100">
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        className="object-cover w-full h-full"
      />
    </div>
  );
}
