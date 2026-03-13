import { prisma } from "@/src/lib/prisma";

export async function getFeaturedProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 4,
        });
        return products;
    } catch (error: any) {
        // This will print the EXACT missing column name in your Vercel logs
        console.error("DEBUG PRISMA ERROR:", JSON.stringify(error, null, 2));
        throw error; 
    }
}
