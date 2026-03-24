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
      include: { _count: { select: { orders: true } } },
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
    const { code, percentage, maxUses, expiresAt } = body ?? {};

    // Validation
    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]{2,20}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: "Code must be 2–20 characters, letters/numbers/hyphens/underscores only" },
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

    let resolvedExpiresAt: Date | null = null;
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime()) || d <= new Date()) {
        return NextResponse.json(
          { error: "Expiry date must be a valid future date" },
          { status: 400 }
        );
      }
      resolvedExpiresAt = d;
    }

    // Check for duplicate code
    const existing = await prisma.discount.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Code "${cleanCode}" already exists` },
        { status: 409 }
      );
    }

    const discount = await prisma.discount.create({
      data: {
        code:       cleanCode,
        percentage: pct,
        maxUses:    resolvedMaxUses,
        expiresAt:  resolvedExpiresAt,
        active:     true,
      },
    });

    return NextResponse.json({ success: true, discount });
  } catch (err) {
    console.error("POST discount error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}