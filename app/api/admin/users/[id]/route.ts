import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_ROLES = Object.values(Role);

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        // Never return password
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10, // last 10 orders only — keeps payload small
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                product: {
                  select: { id: true, name: true, image: true, team: true },
                },
                variant: {
                  select: { size: true, version: true },
                },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            product: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            cartItems: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET user error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { role } = body ?? {};

    // Validate role is a known enum value
    if (!role || !VALID_ROLES.includes(role as Role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Prevent admin from demoting themselves
    if (session.user?.id === id && role === "USER") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role" },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("PATCH user error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}