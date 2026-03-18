import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { OrderStatus } from "@prisma/client";

const VALID_STATUSES = Object.values(OrderStatus);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Pagination
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limitRaw = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get("limit") || DEFAULT_PAGE_SIZE))
    );

    // Filters
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && VALID_STATUSES.includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Valid sort fields to prevent injection
    const VALID_SORT_FIELDS = ["createdAt", "total", "status"];
    const resolvedSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true, team: true },
              },
              variant: {
                select: { size: true, version: true },
              },
            },
          },
        },
        orderBy: { [resolvedSortBy]: sortOrder },
        skip: (page - 1) * limitRaw,
        take: limitRaw,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit: limitRaw,
        totalPages: Math.ceil(total / limitRaw),
      },
    });
  } catch (err) {
    console.error("GET orders error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}