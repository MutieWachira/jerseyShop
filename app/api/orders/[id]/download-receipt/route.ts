import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { generateReceiptPdfBlob } from "@/src/lib/receipt-generator";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { id: orderId } = await params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { items: { include: { product: true } } }
  });

  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const receiptNumber = order.orderNumber ? `REC-${order.orderNumber}` : `REC-${order.id}`;
  const pdfBuffer = await generateReceiptPdfBlob(order, receiptNumber);

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receiptNumber}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
