import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// ─── GET /api/admin/discounts ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        products: { include: { product: { select: { id: true, name: true, team: true } } } },
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json(discounts);
  } catch (err) {
    console.error("GET discounts error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── POST /api/admin/discounts ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      percentage,
      maxUses,
      eventName,
      autoApply: requestedAutoApply,
      productIds,
      startsAt,
      expiresAt,
      dateTimeZone,
    } = body ?? {};
    const timeZone = typeof dateTimeZone === "string" && dateTimeZone
      ? dateTimeZone
      : "UTC";
    try {
      new Intl.DateTimeFormat("en", { timeZone });
    } catch {
      return NextResponse.json({ error: "Invalid date time zone" }, { status: 400 });
    }
    const autoApply = requestedAutoApply ?? false;

    if (typeof autoApply !== "boolean") {
      return NextResponse.json({ error: "Choose whether this discount is an automatic sale" }, { status: 400 });
    }

    let cleanCode: string | null = null;
    if (!autoApply) {
      if (!code || typeof code !== "string" || !code.trim()) {
        return NextResponse.json({ error: "Code is required for coupon discounts" }, { status: 400 });
      }

      cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z0-9_-]{2,20}$/.test(cleanCode)) {
        return NextResponse.json(
          { error: "Code must be 2–20 characters, letters/numbers/hyphens/underscores only" },
          { status: 400 }
        );
      }
    }

    const cleanEventName =
      typeof eventName === "string" && eventName.trim() ? eventName.trim() : null;
    if (autoApply && (!cleanEventName || cleanEventName.length > 80)) {
      return NextResponse.json(
        { error: "Automatic sales need an event name of 1–80 characters" },
        { status: 400 }
      );
    }

    const pct = Number(percentage);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
      return NextResponse.json(
        { error: "Percentage must be a whole number between 1 and 100" },
        { status: 400 }
      );
    }

    // maxUses: null = unlimited, otherwise must be a positive integer
    let resolvedMaxUses: number | null = null;
    if (maxUses !== undefined && maxUses !== null && maxUses !== "") {
      const n = Number(maxUses);
      if (!Number.isInteger(n) || n < 1) {
        return NextResponse.json(
          { error: "Max uses must be a positive whole number, or leave blank for unlimited" },
          { status: 400 }
        );
      }
      resolvedMaxUses = n;
    }

    let resolvedStartsAt: Date | null = null;
    if (startsAt) {
      const start = new Date(startsAt);
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: "Start date must be valid" }, { status: 400 });
      }
      if (getCalendarDate(start, timeZone) < getCalendarDate(new Date(), timeZone)) {
        return NextResponse.json(
          { error: "The sale start date cannot be before today" },
          { status: 400 }
        );
      }
      resolvedStartsAt = start;
    }

    let resolvedExpiresAt: Date | null = null;
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime()) || d <= new Date()) {
        return NextResponse.json(
          { error: "Expiry date must be a valid future date" },
          { status: 400 }
        );
      }
      if (getCalendarDate(d, timeZone) < getCalendarDate(new Date(), timeZone)) {
        return NextResponse.json(
          { error: "The expiry date cannot be before today" },
          { status: 400 }
        );
      }
      resolvedExpiresAt = d;
    }

    if (autoApply) {
      if (!resolvedStartsAt || !resolvedExpiresAt || resolvedExpiresAt <= resolvedStartsAt) {
        return NextResponse.json(
          { error: "Automatic sales need a start date and a later end date" },
          { status: 400 }
        );
      }
      if (!Array.isArray(productIds) || productIds.length === 0 ||
          productIds.some((id: unknown) => !Number.isInteger(id) || Number(id) < 1)) {
        return NextResponse.json(
          { error: "Select at least one jersey for an automatic sale" },
          { status: 400 }
        );
      }
      const uniqueProductIds = [...new Set<number>(productIds)];
      const activeProductCount = await prisma.product.count({
        where: { id: { in: uniqueProductIds }, active: true },
      });
      if (activeProductCount !== uniqueProductIds.length) {
        return NextResponse.json({ error: "One or more selected jerseys are unavailable" }, { status: 400 });
      }
    } else if (resolvedStartsAt && resolvedExpiresAt && resolvedExpiresAt <= resolvedStartsAt) {
      return NextResponse.json({ error: "Expiry date must be later than the start date" }, { status: 400 });
    }

    // Check for duplicate code
    if (cleanCode) {
      const existing = await prisma.discount.findUnique({ where: { code: cleanCode } });
      if (existing) {
        return NextResponse.json(
          { error: `Code "${cleanCode}" already exists` },
          { status: 409 }
        );
      }
    }

    function getCalendarDate(date: Date, timeZone: string) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
      return `${values.year}-${values.month}-${values.day}`;
    }

    const discount = await prisma.discount.create({
      data: {
        code:       cleanCode,
        percentage: pct,
        eventName:  cleanEventName,
        autoApply,
        maxUses:    autoApply ? null : resolvedMaxUses,
        startsAt:   resolvedStartsAt,
        expiresAt:  resolvedExpiresAt,
        active:     true,
        ...(autoApply && {
          products: {
            create: [...new Set<number>(productIds)].map((productId) => ({
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

    return NextResponse.json({ success: true, discount });
  } catch (err) {
    console.error("POST discount error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}