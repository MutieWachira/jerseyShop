import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Destructure exactly what the frontend sends
    const { name, description, price, image, team, categoryId, variants } = body;

    // 1. Validation - Ensure all required core fields exist
    if (!name || !description || !price || !image || !team || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Check if category exists before attempting creation
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: "Selected category does not exist" }, { status: 404 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const priceInt = Math.round(Number(price) * 100);

    // 3. Create product with Nested Variants
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: priceInt,
        image,
        team,
        categoryId,
        variants: Array.isArray(variants) && variants.length > 0 ? {
          create: variants.map((v: any) => ({
            size: v.size,
            version: v.version || "FAN",
            stock: Number(v.stock) || 0,
          })),
        } : undefined,
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("POST products error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Product slug or unique field already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal Server Error", details: error?.message ?? "" }, { status: 500 });
  }
}
