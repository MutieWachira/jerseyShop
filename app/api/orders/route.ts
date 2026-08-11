import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { OrderStatus, PaymentMethod, Size, KitVersion } from "@prisma/client";

// Rate Limiting Mock Wrapper - Ensure you protect this endpoint from brute force attacks
import { rateLimit } from "@/src/lib/rate-limiter"; 

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId query parameter required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    select: { id: true, orderNumber: true, status: true, total: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function POST(req: NextRequest) {
  // 1. Enforce Rate Limiting Security Layer
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const limiter = await rateLimit(ip, 5, 60000); // 5 attempts per minute max
  if (!limiter.success) {
    return new NextResponse("Too Many Requests", { status: 429, headers: limiter.headers });
  }

  try {
    // 2. Authenticate Session Security Guard
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { shipping, paymentMethod, items, discountCode, shippingFee } = body ?? {};

    const normalizedShippingFee = Number(shippingFee ?? 0) || 0;

    // 3. Strict Payload Type Assertions
    if (!shipping?.name || !shipping?.email || !shipping?.phone || !shipping?.address || !shipping?.city) {
      return NextResponse.json({ error: "All shipping details are required" }, { status: 400 });
    }

    if (!["mpesa", "card"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment selection" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your shopping cart is empty" }, { status: 400 });
    }

    // 4. Execute Atomic Database Operations (Prevents Race Conditions)
    const order = await prisma.$transaction(async (tx) => {
      
      let calculatedSubtotal = 0;

      // Validate and collect item snapshots inside the transaction transaction lock
      const processedItems = [];
      for (const item of items) {
        // Fetch variant dynamically directly from the transaction pipeline state
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true }
        });

        if (!variant || !variant.product.active) {
          throw new Error(`Product variant ${item.variantId} is no longer available.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock available for ${variant.product.name}. Only ${variant.stock} left.`);
        }

        // Calculate actual financials based on authenticated server-side pricing data source
        const unitPrice = variant.product.price;
        const customizationCost = item.customizationCost || 0;
        const lineTotal = unitPrice * item.quantity + customizationCost;
        
        calculatedSubtotal += lineTotal;

        // Deduct active physical inventory stock immediately inside the lock
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } }
        });

        processedItems.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          image: variant.product.image,
          size: variant.size,         // Maps cleanly to schema Size Enum
          version: variant.version,   // Maps cleanly to schema KitVersion Enum
          quantity: item.quantity,
          unitPrice: unitPrice,
          customizationCost: customizationCost,
          customizationDetails: item.customizationDetails ?? null,
          totalPrice: lineTotal
        });
      }

      const preDiscountTotal = calculatedSubtotal + normalizedShippingFee;
      let discountId = null;
      let discountPct = 0;
      let discountAmount = 0;

      if (discountCode) {
        const discount = await tx.discount.findUnique({
          where: { code: discountCode.trim().toUpperCase() }
        });

        if (discount && discount.active && (!discount.expiresAt || new Date() <= discount.expiresAt)) {
          if (discount.maxUses === null || discount.usedCount < discount.maxUses) {
            discountId = discount.id;
            discountPct = discount.percentage;
            discountAmount = Math.floor(preDiscountTotal * (discountPct / 100));
            if (discount.maximumDiscount && discountAmount > discount.maximumDiscount) {
              discountAmount = discount.maximumDiscount;
            }

            await tx.discount.update({
              where: { id: discount.id },
              data: { usedCount: { increment: 1 } }
            });
          }
        }
      }

      const finalTotal = Math.max(0, preDiscountTotal - discountAmount);
      const isFreeOrder = finalTotal === 0;
      const orderStatus = isFreeOrder ? OrderStatus.PAID : OrderStatus.PENDING_PAYMENT;
      const uniqueOrderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // 6. Persist Immutable Order Document Logs
      // First, clear the user's cart items inside the same transaction to avoid leaving stale cart entries.
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          cartItems: {
            deleteMany: {
              variantId: { in: items.map(i => i.variantId) }
            }
          }
        }
      });

      // Now create the order and connect it to the user (use relation connect rather than a scalar userId)
      return await tx.order.create({
        data: {
          orderNumber: uniqueOrderNumber,
          user: { connect: { id: session.user.id } },
          shippingName: shipping.name,
          shippingEmail: shipping.email,
          shippingPhone: shipping.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          paymentMethod: paymentMethod === "mpesa" ? PaymentMethod.MPESA : PaymentMethod.CARD,
          status: orderStatus,
          subtotal: calculatedSubtotal,
          shippingFee: normalizedShippingFee,
          discountAmount: discountAmount,
          total: finalTotal,
          discount: discountId ? { connect: { id: discountId } } : undefined,
          discountCode: discountCode ? discountCode.toUpperCase() : null,
          discountPct: discountPct,
          items: {
            create: processedItems
          },
          // Build out the initial order system auditing state record
          timeline: {
            create: {
              status: orderStatus,
              message: isFreeOrder
                ? "Order completed automatically because the total due was zero."
                : "Checkout initialized. Awaiting confirmation validation from provider.",
              actor: "SYSTEM"
            }
          }
        }
      });
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        paymentRequired: order.total !== 0,
        orderStatus: order.status,
      },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("CRITICAL_ORDER_API_EXCEPTION:", err);
    // Explicit clean error string fallback response rules
    return NextResponse.json(
      { error: err.message || "An unexpected system transaction boundary error occurred." }, 
      { status: 400 }
    );
  }
}