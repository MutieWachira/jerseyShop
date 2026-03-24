import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

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
    const { active } = body ?? {};

    if (typeof active !== "boolean") {
      return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
    }

    const updated = await prisma.discount.update({
      where: { id },
      data:  { active },
    });

    return NextResponse.json({ success: true, discount: updated });
  } catch (err) {
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