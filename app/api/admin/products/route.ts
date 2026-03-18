import { NextRequest, NextResponse } from "next/server";
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
    const body = await req.json();

    // Destructure exactly what the frontend sends
    const { name, description, price, image, team, categoryId, variants } = body;

    // 1. Validation - Ensure all required core fields exist
    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Check if category exists before attempting creation
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!categoryExists) {
      return NextResponse.json({ error: "Selected category does not exist" }, { status: 404 });
    }

    // 3. Create product with Nested Variants
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price.toString()), 
        image,
        team,
        categoryId,
        // Logic check: only create variants if the array is provided and not empty
        variants: (variants && Array.isArray(variants) && variants.length > 0) ? {
          create: variants.map((v: any) => ({
            size: v.size, // Must match your Size Enum (XS, S, M...)
            version: v.version || "FAN", // Must match KitVersion Enum
            stock: parseInt(v.stock?.toString() || "0")
          }))
        } : undefined
      },
      include: {
        variants: true // Return the created variants in the response
      }
    });

    return NextResponse.json(product, { status: 201 });

  } catch (error: any) {
    console.error("POST products error:", error);
    
    // Specific error handling for Prisma Enum validation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Product unique constraint failed" }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
