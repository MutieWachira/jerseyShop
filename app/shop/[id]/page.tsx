import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import ProductDetailClient from "@/src/components/ProductDetailClient";
import { getProductSales, withProductSales } from "@/src/lib/product-discounts";

interface Props {
  params: Promise<{ id: string }>; // URL params are always strings
}

export default async function ProductDetailPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  // Guard against non-numeric route segments e.g. /shop/abc
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) {
    notFound();
  }

  const sales = await getProductSales([product.id]);
  const [productWithSale] = withProductSales([product], sales);

  return <ProductDetailClient product={productWithSale} />;
}