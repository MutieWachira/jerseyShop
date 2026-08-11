import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { normalizeMpesaPhone, sendMpesaB2C } from "@/src/lib/mpesa";
import { OrderStatus } from "@prisma/client";
import { auditLog } from "@/src/lib/audit";

// Allow admins to request any withdrawal amount; keep a sensible minimum of 1 KES.
const MIN_WITHDRAWAL_AMOUNT = 1;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalRevenueRaw, totalWithdrawnRaw, pendingWithdrawnRaw, recentWithdrawals, recentPayments] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
      }),
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" },
      }),
      prisma.withdrawal.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          admin: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { order: { select: { orderNumber: true, userId: true } } },
      }),
    ]);

    const totalRevenue = totalRevenueRaw._sum.total ?? 0;
    const totalWithdrawn = totalWithdrawnRaw._sum.amount ?? 0;
    const pendingWithdrawals = pendingWithdrawnRaw._sum.amount ?? 0;
    const availableBalance = Math.max(0, totalRevenue - totalWithdrawn - pendingWithdrawals);

    return NextResponse.json({
      totalRevenue,
      totalWithdrawn,
      pendingWithdrawals,
      availableBalance,
      recentWithdrawals,
      recentPayments,
    });
  } catch (err) {
    console.error("GET finance overview error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body?.amount ?? 0);
    const phone = normalizeMpesaPhone(body?.phone ?? "");
    const password = String(body?.password ?? "").trim();

    if (!amount || amount < MIN_WITHDRAWAL_AMOUNT) {
      console.debug("[ADMIN/FINANCE] invalid withdrawal amount", { body, amount });
      return NextResponse.json({ error: `Withdrawal amount must be at least Ksh ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}` }, { status: 400 });
    }

    if (!/^2547\d{8}$/.test(phone)) {
      console.debug("[ADMIN/FINANCE] invalid phone format", { body, phone });
      return NextResponse.json({ error: "Invalid M-Pesa phone format. Use 07XXXXXXXX or +2547XXXXXXXX" }, { status: 400 });
    }

    if (!password) {
      console.debug("[ADMIN/FINANCE] missing admin password", { body });
      return NextResponse.json({ error: "Admin password is required to authorize withdrawals" }, { status: 400 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
    if (!adminUser) {
      console.debug("[ADMIN/FINANCE] admin user not found", { userId: session.user.id });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!adminUser.password) {
      return NextResponse.json({ error: "This admin account cannot authorize password-protected withdrawals" }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, adminUser.password);
    if (!validPassword) {
      console.debug("[ADMIN/FINANCE] invalid admin password", { userId: session.user.id });
      return NextResponse.json({ error: "Invalid admin password" }, { status: 403 });
    }

    const [revenueResult, withdrawnResult, pendingResult] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
      }),
      prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
      prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    ]);

    const totalRevenue = revenueResult._sum.total ?? 0;
    const totalWithdrawn = withdrawnResult._sum.amount ?? 0;
    const pendingWithdrawn = pendingResult._sum.amount ?? 0;
    const availableBalance = Math.max(0, totalRevenue - totalWithdrawn - pendingWithdrawn);

    // Admins may withdraw amounts greater than current available balance if desired.
    // We will still record the withdrawal and attempt disbursement; balance accounting is derived from orders and completed withdrawals.

    const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const withdrawal = await prisma.withdrawal.create({
      data: {
        admin: { connect: { id: session.user.id } },
        amount,
        phone,
        reference,
        status: "PENDING",
      },
    });

    auditLog({
      actorId: session.user.id,
      actorType: "ADMIN",
      action: "WITHDRAWAL_CREATED",
      resourceType: "Withdrawal",
      resourceId: withdrawal.id,
      metadata: { amount, phone, reference },
    }).catch(() => {});

    // Attempt disbursement, but don't fail the entire request if B2C is not configured.
    let disburseResponse: any = null;
    try {
      disburseResponse = await sendMpesaB2C({
        phone,
        amount,
        reference,
        remarks: `Withdrawal ${reference}`,
      });

      const transactionId = disburseResponse?.ConversationID || disburseResponse?.TransactionID || disburseResponse?.conversationID || null;
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "PENDING",
          transactionId,
          gatewayResponse: disburseResponse,
        },
      });

      auditLog({
        actorId: session.user.id,
        actorType: "ADMIN",
        action: "WITHDRAWAL_DISBURSE_ATTEMPT",
        resourceType: "Withdrawal",
        resourceId: withdrawal.id,
        metadata: { transactionId, disburseResponse },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        withdrawal: updatedWithdrawal,
        disburseResponse,
        message: "Withdrawal request submitted. M-Pesa will confirm the transfer shortly.",
      });
    } catch (err: any) {
      console.error("M-Pesa B2C request failed:", err?.message || err);

      // If environment variables for B2C are missing, keep the withdrawal as PENDING
      // so the admin can see and process it later. Do not mark as FAILED automatically.
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "PENDING",
          gatewayResponse: { error: err?.message ?? String(err) },
        },
      });

      auditLog({
        actorId: session.user.id,
        actorType: "ADMIN",
        action: "WITHDRAWAL_DISBURSE_FAILED",
        resourceType: "Withdrawal",
        resourceId: withdrawal.id,
        metadata: { error: err?.message ?? String(err) },
      }).catch(() => {});

      const isMissingEnv = String(err?.message || "").includes("Missing environment variable");
      return NextResponse.json(
        {
          success: true,
          withdrawal: updatedWithdrawal,
          disburseResponse: null,
          message: isMissingEnv
            ? "Withdrawal recorded but MPesa B2C is not configured. Set MPESA_B2C_* env vars to enable automatic disbursement."
            : `Withdrawal recorded. Disbursement attempt failed: ${err?.message ?? "unknown error"}`,
        },
        { status: isMissingEnv ? 200 : 200 }
      );
    }
  } catch (err) {
    console.error("POST finance withdrawal error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
