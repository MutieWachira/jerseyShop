import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getProductSales } from "@/src/lib/product-discounts";

type DiscountValidationItem = {
  productId: number;
  quantity: number;
  customizationCost?: number;
};

function isDiscountValidationItem(value: unknown): value is DiscountValidationItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return Number.isInteger(item.productId) && Number(item.productId) > 0 &&
    Number.isInteger(item.quantity) && Number(item.quantity) > 0 &&
    (item.customizationCost === undefined ||
      (Number.isInteger(item.customizationCost) && Number(item.customizationCost) >= 0));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to apply a discount" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { code } = body ?? {};
    const items: unknown = body?.items;
    let cartTotal: number;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Discount code is required" }, { status: 400 });
    }

    const discount = await prisma.discount.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    // Code not found
    if (!discount) {
      return NextResponse.json({ error: "Invalid discount code" }, { status: 404 });
    }

    // Inactive
    if (!discount.active) {
      return NextResponse.json({ error: "This discount code is no longer active" }, { status: 400 });
    }

    const now = new Date();
    if (discount.autoApply) {
      return NextResponse.json({ error: "This is an automatic sale, not a coupon code" }, { status: 400 });
    }

    if (discount.startsAt && now < discount.startsAt) {
      return NextResponse.json({ error: "This discount code is not active yet" }, { status: 400 });
    }

    // Expired
    if (discount.expiresAt && now > discount.expiresAt) {
      return NextResponse.json({ error: "This discount code has expired" }, { status: 400 });
    }

    // Max uses reached
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return NextResponse.json(
        { error: "This discount code has reached its maximum number of uses" },
        { status: 400 }
      );
    }

    if (Array.isArray(items)) {
      if (items.length === 0 || !items.every(isDiscountValidationItem)) {
        return NextResponse.json({ error: "Invalid or empty cart items" }, { status: 400 });
      }

      const productIds = [...new Set(items.map((item) => item.productId))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, active: true },
        select: { id: true, price: true },
      });
      if (products.length !== productIds.length) {
        return NextResponse.json({ error: "One or more jerseys in your cart are unavailable" }, { status: 400 });
      }

      const salePrices = await getProductSales(productIds, now);
      const productPrices = new Map(products.map((product) => [product.id, product.price]));
      cartTotal = items.reduce((total, item) => {
        const basePrice = productPrices.get(item.productId)!;
        const unitPrice = salePrices.get(item.productId)?.salePrice ?? basePrice;
        return total + unitPrice * item.quantity + (item.customizationCost ?? 0);
      }, 0);
    } else if (typeof body?.cartTotal === "number") {
      cartTotal = body.cartTotal;
    } else {
      return NextResponse.json({ error: "Your shopping cart is empty" }, { status: 400 });
    }

    if (cartTotal <= 0) {
      return NextResponse.json({ error: "Invalid cart total" }, { status: 400 });
    }

    // Calculate discount amount
    const discountAmount = Math.round((cartTotal * discount.percentage) / 100);
    const finalTotal     = cartTotal - discountAmount;

    return NextResponse.json({
      valid:          true,
      code:           discount.code,
      percentage:     discount.percentage,
      discountAmount,
      finalTotal,
      message:        `${discount.percentage}% off applied — you save Ksh ${discountAmount.toLocaleString()}`,
    });
  } catch (err) {
    console.error("Discount validate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}