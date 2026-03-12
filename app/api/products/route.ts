import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // 1. Destructure the missing required fields (image and categoryId)
        const { name, team, description, price, image, categoryId } = body;

        const product = await prisma.product.create({
            data: {
                name,
                team,
                description,
                price: Number(price), // Ensure price is a number for Prisma
                image,                // Added missing required field
                categoryId            // Added missing required field
            }
        });
        
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error(error); // Helpful for debugging Vercel logs
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
