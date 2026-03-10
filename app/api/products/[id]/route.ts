import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

// Define the type for params as a Promise
type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
    // 1. Await the params
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where: { id: id } // Use the awaited id
    });

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: RouteContext) {
    // 1. Await the params
    const { id } = await params;
    const body = await request.json();

    const updatedProduct = await prisma.product.update({
        where: { id: id },
        data: body
    });

    return NextResponse.json(updatedProduct);
}

export async function DELETE(request: Request, { params }: RouteContext) {
    // 1. Await the params
    const { id } = await params;

    await prisma.product.delete({
        where: { id: id }
    });

    return NextResponse.json({ message: "Product deleted successfully" });
}