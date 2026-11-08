import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { productPriceSchema } from "@/src/lib/validators/product";

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

        const parsedPrice = productPriceSchema.safeParse(Number(price));
        if (!parsedPrice.success) {
            return NextResponse.json({ error: "Price must be a positive whole number of Ksh" }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name: String(name),
                team: String(team),
                description: String(description),
                price: parsedPrice.data,
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
