import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run all queries in parallel for speed
    const [
      totalOrdersResult,
      totalSalesResult,
      totalProducts,
      totalUsers,
      recentOrders,
      monthlySales,
    ] = await Promise.all([

      // Total orders count
      prisma.order.count(),

      // Total sales sum
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),

      // Total products
      prisma.product.count(),

      // Total users (non-admin)
      prisma.user.count({ where: { role: "USER" } }),

      // Recent 10 orders with customer info
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),

      // Last 6 months revenue grouped by month
      prisma.$queryRaw<{ month: string; revenue: number; orders: number }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
          COALESCE(SUM(total), 0)::float                   AS revenue,
          COUNT(*)::int                                     AS orders
        FROM "Order"
        WHERE
          "createdAt" >= NOW() - INTERVAL '6 months'
          AND status != 'CANCELLED'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `,
    ]);

    return NextResponse.json({
      stats: {
        totalOrders: totalOrdersResult,
        totalSales: totalSalesResult._sum.total ?? 0,
        totalProducts,
        totalUsers,
      },
      recentOrders,
      monthlySales,
    });
  } catch (err) {
    console.error("GET dashboard stats error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}