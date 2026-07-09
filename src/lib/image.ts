export function normalizeProductImage(image: string | null | undefined) {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }

  return `/${image.replace(/^\//, "")}`;
}
