import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

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
    const { code, cartTotal } = body ?? {};

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Discount code is required" }, { status: 400 });
    }

    if (typeof cartTotal !== "number" || cartTotal <= 0) {
      return NextResponse.json({ error: "Invalid cart total" }, { status: 400 });
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

    // Expired
    if (discount.expiresAt && new Date() > discount.expiresAt) {
      return NextResponse.json({ error: "This discount code has expired" }, { status: 400 });
    }

    // Max uses reached
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return NextResponse.json(
        { error: "This discount code has reached its maximum number of uses" },
        { status: 400 }
      );
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