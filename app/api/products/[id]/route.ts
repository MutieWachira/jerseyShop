import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

// FIX: Params in the URL are ALWAYS strings by default in Next.js
type RouteContext = {
    params: Promise<{ id: number }>; 
};

export async function GET(request: Request, { params }: RouteContext) {
    // 1. Await the params
    const resolvedParams = await params;
    // 2. Convert string ID to number for Prisma
    const id = Number(resolvedParams.id);

    const product = await prisma.product.findUnique({
        where: { id } 
    });

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: RouteContext) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const body = await request.json();

    const updatedProduct = await prisma.product.update({
        where: { id },
        data: body
    });

    return NextResponse.json(updatedProduct);
}

export async function DELETE(request: Request, { params }: RouteContext) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    await prisma.product.delete({
        where: { id }
    });

    return NextResponse.json({ message: "Product deleted successfully" });
}
