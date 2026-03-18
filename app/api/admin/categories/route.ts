import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma" // Adjust path to your prisma client

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
