import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { productPriceSchema, productVariantsSchema } from "@/src/lib/validators/product";

function parseProductYear(value: unknown): { valid: boolean; value: number | null } {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: null };
  }
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 && year <= 2100
    ? { valid: true, value: year }
    : { valid: false, value: null };
}

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
    const { name, description, price, year, image, team, categoryId, variants } = body;

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
    const parsedPrice = productPriceSchema.safeParse(Number(price));
    if (!parsedPrice.success) {
      return NextResponse.json({ error: "Price must be a positive whole number of Ksh" }, { status: 400 });
    }
    const parsedVariants = productVariantsSchema.safeParse(variants ?? []);
    if (!parsedVariants.success) {
      return NextResponse.json({ error: "Invalid product variants" }, { status: 400 });
    }
    const parsedYear = parseProductYear(year);
    if (!parsedYear.valid) {
      return NextResponse.json({ error: "Jersey year must be a whole year between 1900 and 2100" }, { status: 400 });
    }

    // 3. Create product with Nested Variants
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parsedPrice.data,
        year: parsedYear.value,
        image,
        team,
        categoryId,
        variants: parsedVariants.data.length > 0 ? {
          create: parsedVariants.data,
        } : undefined,
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    console.error("POST products error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Product slug or unique field already exists" }, { status: 409 });
    }

    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Internal Server Error", details }, { status: 500 });
  }
}
