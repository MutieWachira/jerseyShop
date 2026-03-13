import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";


// GET /api/admin/products
// FIXED: Restored this function so your table can actually load data
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, description, price, image, team, categoryId, variants } = body;

    // 1. Validation
    if (!name || !description || !price || !image || !team || !categoryId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 2. Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 3. Create product with Type Conversions
    // IMPROVEMENT: Using Number() handles both string and number inputs safely
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: typeof price === "string" ? parseFloat(price) : price, 
        image,
        team,
        categoryId,
        // Using the relation to create variants simultaneously
        variants: variants && Array.isArray(variants) ? {
          create: variants.map((v: any) => ({
            size: v.size,
            version: v.version,
            stock: typeof v.stock === "string" ? parseInt(v.stock) : v.stock
          }))
        } : undefined
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
