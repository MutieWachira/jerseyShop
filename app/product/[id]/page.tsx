import {prisma} from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/src/components/ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  // Fetch the REAL product from your database
  const product = await prisma.product.findUnique({
    where: { id: id }, // Use Number(id) if your DB IDs are integers
  });

  if (!product) {
    return notFound(); // Shows the Next.js 404 page
  }

  // Pass the database product to the client component for the Interactivity (Cart)
  return <ProductDetailClient product={product} />;
}
