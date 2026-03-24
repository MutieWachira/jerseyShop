import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to place an order" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { shipping, paymentMethod, items, total, discountCode } = body ?? {};

    // Shipping validation
    if (
      !shipping?.name ||
      !shipping?.email ||
      !shipping?.phone ||
      !shipping?.address ||
      !shipping?.city
    ) {
      return NextResponse.json(
        { error: "All shipping fields are required" },
        { status: 400 }
      );
    }

    if (!["mpesa", "card"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json(
        { error: "Invalid order total" },
        { status: 400 }
      );
    }

    // Resolve discount if a code was provided
    let discountRecord: {
      id: string;
      code: string;
      percentage: number;
      maxUses: number | null;
      usedCount: number;
      expiresAt: Date | null;
      active: boolean;
    } | null = null;

    if (discountCode && typeof discountCode === "string") {
      const found = await prisma.discount.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      });

      // Silently ignore invalid codes at order time —
      // the frontend already validated, but we re-check server-side
      if (
        found &&
        found.active &&
        (!found.expiresAt || new Date() <= found.expiresAt) &&
        (found.maxUses === null || found.usedCount < found.maxUses)
      ) {
        discountRecord = found;
      }
    }

    // Verify all variants exist and have sufficient stock
    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where:  { id: item.variantId },
        select: { id: true, stock: true, productId: true },
      });

      if (!variant) {
        return NextResponse.json(
          { error: "Variant not found for one of your items" },
          { status: 400 }
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          { error: "Insufficient stock for one of your items" },
          { status: 400 }
        );
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId:       session.user.id,
        total,
        status:       "PENDING",
        // Snapshot discount details at time of order
        discountId:   discountRecord?.id   ?? null,
        discountCode: discountRecord?.code ?? null,
        discountPct:  discountRecord?.percentage ?? null,
        items: {
          create: items.map((item: {
            productId:         number;
            variantId:         string;
            quantity:          number;
            price:             number;
            customisationCost: number;
          }) => ({
            productId: Number(item.productId),
            variantId: item.variantId,
            quantity:  item.quantity,
            price:     item.price + (item.customisationCost || 0),
          })),
        },
      },
    });

    // Deduct stock sequentially
    for (const item of items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data:  { stock: { decrement: item.quantity } },
      });
    }

    // Increment discount usedCount
    if (discountRecord) {
      await prisma.discount.update({
        where: { id: discountRecord.id },
        data:  { usedCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("POST order error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}