import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { queryAuditLogs } from "@/src/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 30);
  const resource = url.searchParams.get("resource") ?? undefined;
  const event = url.searchParams.get("event") ?? undefined;

  const data = await queryAuditLogs({
    page,
    limit,
    resource,
    event,
  });

  return NextResponse.json(data);
}
