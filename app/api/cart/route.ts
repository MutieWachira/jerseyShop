import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// ─── Shared select shape ──────────────────────────────────────────────────────
// Returns enough data to reconstruct a CartItem on the frontend

const CART_INCLUDE = {
  variant: {
    include: {
      product: {
        select: {
          id:          true,
          name:        true,
          price:       true,
          image:       true,
          description: true,
          team:        true,
          categoryId:  true,
        },
      },
    },
  },
} as const;

// ─── GET /api/cart — load user's cart from DB ─────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.cartItem.findMany({
      where:   { userId: session.user.id },
      include: CART_INCLUDE,
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET cart error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── POST /api/cart — add item or increment quantity ─────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { variantId, quantity = 1 } = body ?? {};

    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json({ error: "variantId is required" }, { status: 400 });
    }

    const qty = Math.max(1, Number(quantity) || 1);

    // Check variant exists and has stock
    const variant = await prisma.productVariant.findUnique({
      where:  { id: variantId },
      select: { id: true, stock: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Upsert — if already in cart, increment quantity
    const existing = await prisma.cartItem.findFirst({
      where: { userId: session.user.id, variantId },
    });

    let cartItem;

    if (existing) {
      const newQty = existing.quantity + qty;
      // Cap at available stock
      const cappedQty = Math.min(newQty, variant.stock);
      cartItem = await prisma.cartItem.update({
        where:   { id: existing.id },
        data:    { quantity: cappedQty },
        include: CART_INCLUDE,
      });
    } else {
      if (variant.stock < 1) {
        return NextResponse.json({ error: "Out of stock" }, { status: 400 });
      }
      cartItem = await prisma.cartItem.create({
        data: {
          userId:    session.user.id,
          variantId,
          quantity:  Math.min(qty, variant.stock),
        },
        include: CART_INCLUDE,
      });
    }

    return NextResponse.json({ success: true, item: cartItem });
  } catch (err) {
    console.error("POST cart error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH /api/cart — update quantity ───────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { variantId, quantity } = body ?? {};

    if (!variantId || typeof quantity !== "number") {
      return NextResponse.json({ error: "variantId and quantity required" }, { status: 400 });
    }

    // Remove item if quantity drops to 0
    if (quantity < 1) {
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id, variantId },
      });
      return NextResponse.json({ success: true, removed: true });
    }

    const item = await prisma.cartItem.findFirst({
      where: { userId: session.user.id, variantId },
    });

    if (!item) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    const updated = await prisma.cartItem.update({
      where:   { id: item.id },
      data:    { quantity },
      include: CART_INCLUDE,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    console.error("PATCH cart error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── DELETE /api/cart — remove item ──────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");

    if (!variantId) {
      return NextResponse.json({ error: "variantId is required" }, { status: 400 });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, variantId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE cart error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PUT /api/cart — merge guest localStorage cart into DB cart on login ──────

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true, merged: 0 });
    }

    let merged = 0;

    for (const item of items) {
      if (!item.variantId || !item.quantity) continue;

      const variant = await prisma.productVariant.findUnique({
        where:  { id: item.variantId },
        select: { id: true, stock: true },
      });

      if (!variant || variant.stock < 1) continue;

      const existing = await prisma.cartItem.findFirst({
        where: { userId: session.user.id, variantId: item.variantId },
      });

      if (existing) {
        // Merge — add guest quantity on top of existing, cap at stock
        const newQty = Math.min(existing.quantity + item.quantity, variant.stock);
        await prisma.cartItem.update({
          where: { id: existing.id },
          data:  { quantity: newQty },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            userId:    session.user.id,
            variantId: item.variantId,
            quantity:  Math.min(item.quantity, variant.stock),
          },
        });
      }

      merged++;
    }

    // Return the full updated cart
    const updatedItems = await prisma.cartItem.findMany({
      where:   { userId: session.user.id },
      include: CART_INCLUDE,
    });

    return NextResponse.json({ success: true, merged, items: updatedItems });
  } catch (err) {
    console.error("PUT cart merge error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}