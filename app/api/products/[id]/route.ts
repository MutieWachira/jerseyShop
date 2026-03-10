import {prisma} from "@/src/lib/prisma";
import {NextResponse} from "next/server";

export async function GET(request: Request, {params}: {params: {id: string}}) {
    const id = Number(params.id);
    const product = await prisma.product.findUnique({
        where: { id: params.id }
    });

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
}

export async function PUT(request: Request, {params}: {params: {id: string} }) {
    const id = String(params.id);
    const body = await request.json();
    const updatedProduct = await prisma.product.update({
        where: { id },
        data: body
    });

    return NextResponse.json(updatedProduct);
}
export async function DELETE(request: Request, {params}: {params: {id: string} }) {
    const id = String(params.id);
    await prisma.product.delete({
        where: { id }
    });

    return NextResponse.json({ message: "Product deleted successfully" });
}