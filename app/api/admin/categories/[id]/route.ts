import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { createAuditLog } from "@/src/lib/audit";
import { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// UPDATE
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Category id missing" }, { status: 400 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    await createAuditLog(req, {
      event: "UPDATE_CATEGORY",
      resource: "categories",
      description: `Updated category ${updated.name}`,
      metadata: { categoryId: updated.id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Category name or slug already exists." }, { status: 409 });
      }
    }

    console.error("[api/admin/categories/[id]] PUT error", error);
    return NextResponse.json({ error: "Unable to update category." }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Category id missing" }, { status: 400 });
  }

  try {
    const deleted = await prisma.category.delete({
      where: { id },
    });

    await createAuditLog(req, {
      event: "DELETE_CATEGORY",
      resource: "categories",
      description: `Deleted category ${deleted.name}`,
      metadata: { categoryId: deleted.id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    console.error("[api/admin/categories/[id]] DELETE error", error);
    return NextResponse.json({ error: "Unable to delete category." }, { status: 500 });
  }
}
