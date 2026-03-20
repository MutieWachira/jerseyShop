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
    const { shipping, paymentMethod, items, total } = body ?? {};

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

    // Payment method — mpesa (STK Push) or card (Flutterwave)
    // No paymentDetails needed here — payment is handled by the
    // respective payment API routes after the order is created
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

    // Create order — starts as PENDING
    // Status moves to PAID via:
    //   M-Pesa → /api/payments/mpesa/callback  (Safaricom webhook)
    //   Card   → /api/payments/flutterwave/webhook (Flutterwave webhook)
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        total,
        status: "PENDING",
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

    // Deduct stock sequentially — avoids $transaction pooler issue
    for (const item of items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data:  { stock: { decrement: item.quantity } },
      });
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("POST order error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}