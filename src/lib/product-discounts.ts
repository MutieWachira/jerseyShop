import { prisma } from "@/src/lib/prisma";

export type ProductSale = {
  salePrice: number;
  salePercentage: number;
  saleEventName: string | null;
};

export async function getProductSales(
  productIds: number[],
  now = new Date()
): Promise<Map<number, ProductSale>> {
  const uniqueProductIds = [...new Set(productIds)];
  if (uniqueProductIds.length === 0) return new Map();

  const discounts = await prisma.discount.findMany({
    where: {
      autoApply: true,
      active: true,
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      products: { some: { productId: { in: uniqueProductIds } } },
    },
    orderBy: [{ percentage: "desc" }, { createdAt: "desc" }],
    select: {
      percentage: true,
      eventName: true,
      products: {
        where: { productId: { in: uniqueProductIds } },
        select: { productId: true, product: { select: { price: true } } },
      },
    },
  });

  const sales = new Map<number, ProductSale>();
  for (const discount of discounts) {
    for (const { productId, product } of discount.products) {
      if (!sales.has(productId)) {
        sales.set(productId, {
          salePrice: Math.round(product.price * (100 - discount.percentage) / 100),
          salePercentage: discount.percentage,
          saleEventName: discount.eventName,
        });
      }
    }
  }

  return sales;
}

export function withProductSales<T extends { id: number; price: number }>(
  products: T[],
  sales: Map<number, ProductSale>
): Array<T & Partial<ProductSale>> {
  return products.map((product) => {
    const sale = sales.get(product.id);
    return { ...product, ...sale };
  });
}
