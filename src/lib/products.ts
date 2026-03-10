import { prisma } from "@/src/lib/prisma";

export async function getFeaturedProducts(){
    const products = await prisma.product.findMany({
        orderBy: {
            createdAt: "desc",
        },
        take: 4,
    });

    return products;
}