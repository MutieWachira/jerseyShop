import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    // Update variants if provided
    if (Array.isArray(variants)) {
      // Delete existing variants then recreate with new values
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      data.variants = {
        create: variants.map((v: { size: string; version: string; stock: number }) => ({
          size: v.size,
          version: v.version,
          stock: Number(v.stock) || 0,
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
        variants: true, // ← now returns size, version, stock
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

    // Sequential deletes instead of $transaction (pooler doesn't support interactive transactions)
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete. Ensure product exists." }, { status: 500 });
  }
}