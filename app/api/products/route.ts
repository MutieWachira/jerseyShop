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

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, team, description, price, image, categoryId } = body;

        if (!name || !team || !description || !price || !image || !categoryId) {
            return NextResponse.json({ error: "Missing required product fields" }, { status: 400 });
        }

        const resolvedPrice = Number(price);
        if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
            return NextResponse.json({ error: "Invalid price value" }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name: String(name),
                team: String(team),
                description: String(description),
                price: resolvedPrice,
                image: String(image),
                slug: slugify(String(name)),
                category: { connect: { id: String(categoryId) } },
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
