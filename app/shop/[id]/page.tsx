import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import ProductDetailClient from "@/src/components/ProductDetailClient";

interface Props {
  params: Promise<{ id: number }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}