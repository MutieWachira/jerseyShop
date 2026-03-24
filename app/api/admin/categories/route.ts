import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

// GET all categories
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

// CREATE category
export async function POST(req: Request) {
  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  // 🔥 auto slug
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const category = await prisma.category.create({
    data: { name, slug },
  });

  return NextResponse.json(category);
}