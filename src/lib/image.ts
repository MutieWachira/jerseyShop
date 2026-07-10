const signedImageUrlCache = new Map<string, string>();

export function normalizeProductImage(image: string | null | undefined) {
  if (!image) return null;

  const trimmed = image.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

export function shouldRequestSignedImageUrl(image: string | null | undefined) {
  if (!image) return false;

  const trimmed = image.trim();
  if (trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.includes(".s3.") || trimmed.includes("amazonaws.com");
  }

  return true;
}

export async function resolveProductImageUrl(image: string | null | undefined, fallback = "/placeholder-jersey.png") {
  if (!image) return fallback;

  const trimmedImage = image.trim();
  if (!trimmedImage) return fallback;

  if (!shouldRequestSignedImageUrl(trimmedImage)) {
    return normalizeProductImage(trimmedImage) || fallback;
  }

  const cachedUrl = signedImageUrlCache.get(trimmedImage);
  if (cachedUrl) return cachedUrl;

  try {
    const res = await fetch(`/api/images?key=${encodeURIComponent(trimmedImage)}`);
    const data = await res.json();
    const resolvedUrl = data.url || fallback;
    signedImageUrlCache.set(trimmedImage, resolvedUrl);
    return resolvedUrl;
  } catch {
    return fallback;
  }
}
