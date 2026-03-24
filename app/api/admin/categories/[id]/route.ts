import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

// UPDATE
export async function PUT(req: Request, { params }: any) {
  const body = await req.json();
  const { name } = body;

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: { name, slug },
  });

  return NextResponse.json(updated);
}

// DELETE
export async function DELETE(_: Request, { params }: any) {
  await prisma.category.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Deleted" });
}