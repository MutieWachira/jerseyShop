import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { OrderStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_STATUSES = Object.values(OrderStatus);

// Valid status transitions — prevents e.g. moving DELIVERED back to PENDING_PAYMENT
const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID:            ["PROCESSING", "CANCELLED"],
  PROCESSING:      ["PACKED", "CANCELLED"],
  PACKED:          ["SHIPPED", "CANCELLED"],
  SHIPPED:         ["DELIVERED"],
  DELIVERED:       [],
  CANCELLED:       [],
  FAILED:          [],
  REFUNDED:        [],
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true, team: true, price: true },
            },
            variant: {
              select: { size: true, version: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("GET order error:", err);
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
    const { status } = body ?? {};

    // Validate status is a known enum value
    if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch current order to validate transition
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(status as OrderStatus)) {
      return NextResponse.json(
        {
          error: `Cannot move order from ${existing.status} to ${status}. Allowed: ${
            allowed.length ? allowed.join(", ") : "none"
          }`,
        },
        { status: 422 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, image: true, team: true } },
            variant: { select: { size: true, version: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("PATCH order error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}