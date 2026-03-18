import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { Size, KitVersion } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Valid enum values for runtime validation
const VALID_SIZES = Object.values(Size);
const VALID_VERSIONS = Object.values(KitVersion);

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const id = Number(rawId);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      team,
      description,
      price,
      image,
      categoryId,
      categoryName,
      category,
      variants,
    } = body ?? {};

    const data: Prisma.ProductUpdateInput = {};
    if (name !== undefined) data.name = String(name);
    if (team !== undefined) data.team = String(team);
    if (description !== undefined) data.description = String(description);
    if (image !== undefined) data.image = String(image);

    if (price !== undefined) {
      const resolvedPrice = Number(price);
      if (!Number.isFinite(resolvedPrice) || resolvedPrice <= 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      data.price = resolvedPrice;
    }

    // Support categoryId (direct connect) or categoryName/category (upsert by name)
    if (categoryId !== undefined) {
      data.category = { connect: { id: String(categoryId) } };
    } else {
      const resolvedCategoryName = (categoryName || category || "").toString().trim();
      if (resolvedCategoryName) {
        const categoryRow = await prisma.category.upsert({
          where: { name: resolvedCategoryName },
          update: {},
          create: { name: resolvedCategoryName },
        });
        data.category = { connect: { id: categoryRow.id } };
      }
    }

    // Update variants with proper enum validation
    if (Array.isArray(variants)) {

      // Validate each variant's enum values before touching the DB
      for (const v of variants) {
        if (!VALID_SIZES.includes(v.size)) {
          return NextResponse.json(
            { error: `Invalid size "${v.size}". Must be one of: ${VALID_SIZES.join(", ")}` },
            { status: 400 }
          );
        }
        if (!VALID_VERSIONS.includes(v.version)) {
          return NextResponse.json(
            { error: `Invalid version "${v.version}". Must be one of: ${VALID_VERSIONS.join(", ")}` },
            { status: 400 }
          );
        }
      }

      // Delete existing variants then recreate with validated values
      await prisma.productVariant.deleteMany({ where: { productId: id } });

      data.variants = {
        create: variants.map((v: { size: string; version: string; stock: number }) => ({
          size: v.size as Size,             // safe cast — validated above
          version: v.version as KitVersion, // safe cast — validated above
          stock: Math.max(0, Number(v.stock) || 0), // prevent negative stock
        })),
      };
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: true },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const id = Number(rawId);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    // Sequential deletes — avoids $transaction pooler limitation
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete. Ensure product exists." }, { status: 500 });
  }
}