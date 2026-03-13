import { NextResponse } from "next/server"
import {prisma} from "@/src/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/lib/auth"

export async function POST(req: Request) {

  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  const variant = await prisma.productVariant.create({
    data: {
      productId: body.productId,
      size: body.size,
      version: body.version,
      stock: body.stock
    }
  })

  return NextResponse.json(variant)
}