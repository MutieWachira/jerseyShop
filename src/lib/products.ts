import { prisma } from "@/src/lib/prisma";

export async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
    });
    return products;
  } catch (error: any) {
    console.error("DEBUG PRISMA ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
}

// Fetches products in the "Retro" category for the hero slideshow.
// To add a jersey to the slideshow: set its category to "Retro" in the admin panel.
// To remove it: change its category to anything else.
export async function getRetroProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: {
          name: {
            equals:   "Retro",
            mode:     "insensitive", // matches "retro", "RETRO" etc.
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6, // max 6 slides — keeps the slideshow clean
      select: {
        id:    true,
        name:  true,
        team:  true,
        price: true,
        image: true,
      },
    });
    return products;
  } catch (error: any) {
    console.error("getRetroProducts error:", JSON.stringify(error, null, 2));
    throw error;
  }
}

//function to get the most sold jerseys for the week
export async function getWeeklyTopProducts() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
    },
    where: {
      order: {
        createdAt: {
          gte: oneWeekAgo,
        },
        status: "PAID", // only count paid orders
      },
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 8,
  });

  const productIds = topProducts.map((p) => p.productId);

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  // Preserve order (important!)
  return productIds.map((id) =>
    products.find((p) => p.id === id)
  );
}