import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// ─── PATCH /api/admin/discounts/[id] — toggle active ─────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid discount update" }, { status: 400 });
    }
    const { active } = body ?? {};

    if (typeof active === "boolean" && Object.keys(body).length === 1) {
      const updated = await prisma.discount.update({
        where: { id },
        data: { active },
      });

      return NextResponse.json({ success: true, discount: updated });
    }

    const existing = await prisma.discount.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    const { code, percentage, eventName, autoApply, maxUses, productIds, startsAt, expiresAt } = body ?? {};
    if (typeof autoApply !== "boolean" || autoApply !== existing.autoApply) {
      return NextResponse.json({ error: "Discount type cannot be changed after creation" }, { status: 400 });
    }

    let cleanCode: string | null = null;
    if (!autoApply) {
      if (typeof code !== "string" || !code.trim()) {
        return NextResponse.json({ error: "Code is required for coupon discounts" }, { status: 400 });
      }
      cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z0-9_-]{2,20}$/.test(cleanCode)) {
        return NextResponse.json({ error: "Code must be 2–20 characters, letters/numbers/hyphens/underscores only" }, { status: 400 });
      }
      const codeOwner = await prisma.discount.findUnique({ where: { code: cleanCode } });
      if (codeOwner && codeOwner.id !== id) {
        return NextResponse.json({ error: `Code "${cleanCode}" already exists` }, { status: 409 });
      }
    }

    const cleanEventName = typeof eventName === "string" && eventName.trim()
      ? eventName.trim()
      : null;
    if (autoApply && (!cleanEventName || cleanEventName.length > 80)) {
      return NextResponse.json({ error: "Automatic sales need an event name of 1–80 characters" }, { status: 400 });
    }

    const resolvedPercentage = Number(percentage);
    if (!Number.isInteger(resolvedPercentage) || resolvedPercentage < 1 || resolvedPercentage > 100) {
      return NextResponse.json({ error: "Percentage must be a whole number between 1 and 100" }, { status: 400 });
    }

    let resolvedMaxUses: number | null = null;
    if (!autoApply && maxUses !== null && maxUses !== undefined && maxUses !== "") {
      resolvedMaxUses = Number(maxUses);
      if (!Number.isInteger(resolvedMaxUses) || resolvedMaxUses < Math.max(1, existing.usedCount)) {
        return NextResponse.json(
          { error: `Max uses must be a whole number of at least ${Math.max(1, existing.usedCount)}, or leave blank for unlimited` },
          { status: 400 }
        );
      }
    }

    const resolvedStartsAt = startsAt ? new Date(startsAt) : null;
    const resolvedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if ((resolvedStartsAt && Number.isNaN(resolvedStartsAt.getTime())) ||
        (resolvedExpiresAt && Number.isNaN(resolvedExpiresAt.getTime()))) {
      return NextResponse.json({ error: "Discount dates must be valid" }, { status: 400 });
    }
    if (autoApply && (!resolvedStartsAt || !resolvedExpiresAt || resolvedExpiresAt <= resolvedStartsAt)) {
      return NextResponse.json({ error: "Automatic sales need a start date and a later end date" }, { status: 400 });
    }
    if (resolvedStartsAt && resolvedExpiresAt && resolvedExpiresAt <= resolvedStartsAt) {
      return NextResponse.json({ error: "Expiry date must be later than the start date" }, { status: 400 });
    }

    const uniqueProductIds = autoApply && Array.isArray(productIds)
      ? [...new Set<number>(productIds.filter((value: unknown) => Number.isInteger(value) && Number(value) > 0))]
      : [];
    if (autoApply && (!Array.isArray(productIds) || uniqueProductIds.length !== productIds.length || uniqueProductIds.length === 0)) {
      return NextResponse.json({ error: "Select at least one jersey for an automatic sale" }, { status: 400 });
    }
    if (autoApply) {
      const activeProducts = await prisma.product.findMany({
        where: { id: { in: uniqueProductIds }, active: true },
        select: { id: true },
      });
      const activeProductIds = new Set(activeProducts.map(({ id: productId }) => productId));
      const previouslySelectedIds = new Set(existing.products.map(({ productId }) => productId));
      if (uniqueProductIds.some((productId) =>
        !activeProductIds.has(productId) && !previouslySelectedIds.has(productId)
      )) {
        return NextResponse.json({ error: "One or more selected jerseys are unavailable" }, { status: 400 });
      }
    }

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        code: cleanCode,
        percentage: resolvedPercentage,
        eventName: cleanEventName,
        maxUses: autoApply ? null : resolvedMaxUses,
        startsAt: resolvedStartsAt,
        expiresAt: resolvedExpiresAt,
        ...(autoApply && {
          products: {
            deleteMany: {},
            create: uniqueProductIds.map((productId) => ({
              product: { connect: { id: productId } },
            })),
          },
        }),
      },
      include: {
        products: { include: { product: { select: { id: true, name: true, team: true } } } },
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json({ success: true, discount: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Discount not found" }, { status: 404 });
      }
      if (err.code === "P2002") {
        return NextResponse.json({ error: "Discount code already exists" }, { status: 409 });
      }
    }
    console.error("PATCH discount error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/discounts/[id] ────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.discount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE discount error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}