import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { OrderStatus } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_KEYS = [
  "shop_name",
  "shop_email",
  "shop_description",
  "low_stock_threshold",
  "default_order_status",
] as const;

type SettingKey = (typeof VALID_KEYS)[number];

const DEFAULTS: Record<SettingKey, string> = {
  shop_name:            "Jersey Shop",
  shop_email:           "",
  shop_description:     "",
  low_stock_threshold:  "5",
  default_order_status: "PENDING",
};

const VALID_ORDER_STATUSES = Object.values(OrderStatus);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Validators ───────────────────────────────────────────────────────────────

function validateSetting(key: string, value: unknown): string | null {
  if (typeof value !== "string") {
    return `Value for "${key}" must be a string`;
  }

  switch (key) {
    case "shop_name": {
      if (!value.trim()) return "Shop name cannot be empty";
      if (value.trim().length > 100) return "Shop name must be 100 characters or fewer";
      break;
    }
    case "shop_email": {
      if (value !== "" && !EMAIL_REGEX.test(value)) {
        return "Invalid email address";
      }
      break;
    }
    case "shop_description": {
      if (value.length > 500) return "Description must be 500 characters or fewer";
      break;
    }
    case "low_stock_threshold": {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 9999) {
        return "Low stock threshold must be a whole number between 0 and 9999";
      }
      break;
    }
    case "default_order_status": {
      if (!VALID_ORDER_STATUSES.includes(value as OrderStatus)) {
        return `Invalid order status. Must be one of: ${VALID_ORDER_STATUSES.join(", ")}`;
      }
      break;
    }
  }

  return null; // no error
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.setting.findMany();

    // Merge DB values over defaults — missing keys always return a safe value
    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      // Only expose known keys — ignore any stale/unknown DB rows
      if (VALID_KEYS.includes(row.key as SettingKey)) {
        settings[row.key] = row.value;
      }
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error("GET settings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }

    const entries = Object.entries(body as Record<string, unknown>);

    if (entries.length === 0) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    // Collect all validation errors before touching the DB
    const errors: string[] = [];
    const validEntries: [string, string][] = [];

    for (const [key, value] of entries) {
      // Reject unknown keys
      if (!VALID_KEYS.includes(key as SettingKey)) {
        errors.push(`Unknown setting key: "${key}"`);
        continue;
      }

      const error = validateSetting(key, value);
      if (error) {
        errors.push(error);
      } else {
        validEntries.push([key, (value as string).trim()]);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
    }

    // FIX: was prisma.Setting (capital S) — Prisma always uses camelCase
    // Sequential upserts — avoids $transaction pooler limitation on Neon/Vercel
    for (const [key, value] of validEntries) {
      await prisma.setting.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH settings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}