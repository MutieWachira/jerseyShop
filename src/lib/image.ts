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
