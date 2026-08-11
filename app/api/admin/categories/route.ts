import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { createAuditLog } from "@/src/lib/audit";
import { Prisma } from "@prisma/client";

// GET all categories
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    await createAuditLog(req, {
      event: "VIEW_CATEGORIES",
      resource: "categories",
      description: "Viewed category list",
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[api/admin/categories] GET error", error);
    return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
  }
}

// CREATE category
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  try {
    const category = await prisma.category.create({
      data: { name, slug },
    });

    await createAuditLog(req, {
      event: "CREATE_CATEGORY",
      resource: "categories",
      description: `Created category ${category.name}`,
      metadata: { categoryId: category.id },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : "name or slug";

      return NextResponse.json(
        { error: `Category ${target} already exists.` },
        { status: 409 }
      );
    }

    console.error("[api/admin/categories] POST error", error);
    return NextResponse.json({ error: "Unable to create category." }, { status: 500 });
  }
}
