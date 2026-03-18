import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@prisma/client";

const VALID_ROLES = Object.values(Role);
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
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Whitelist sort fields
    const VALID_SORT_FIELDS = ["createdAt", "name", "email"];
    const resolvedSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (roleFilter && VALID_ROLES.includes(roleFilter as Role)) {
      where.role = roleFilter as Role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              reviews: true,
              cartItems: true,
            },
          },
        },
        orderBy: { [resolvedSortBy]: sortOrder },
        skip: (page - 1) * limitRaw,
        take: limitRaw,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit: limitRaw,
        totalPages: Math.ceil(total / limitRaw),
      },
    });
  } catch (err) {
    console.error("GET users error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}