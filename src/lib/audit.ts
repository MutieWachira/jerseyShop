import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";

export interface AuditLogPayload {
  event: string;
  resource: string;
  description: string;
  metadata?: Record<string, unknown>;
}

function getIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const ip = req.headers.get("x-real-ip");
  if (ip) return ip;

  return "unknown";
}

export async function createAuditLog(req: Request, payload: AuditLogPayload) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const ip = getIpFromRequest(req);

    return await prisma.auditLog.create({
      data: {
        userId,
        event: payload.event,
        resource: payload.resource,
        description: payload.description,
        ip,
        userAgent,
        metadata: payload.metadata ?? {},
      },
    });
  } catch (error) {
    console.error("[audit] failed to create audit log", error);
    return null;
  }
}

export async function queryAuditLogs(options: {
  page?: number;
  limit?: number;
  resource?: string;
  event?: string;
}) {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const where: Record<string, unknown> = {};

  if (options.resource) {
    Object.assign(where, { resource: options.resource });
  }

  if (options.event) {
    Object.assign(where, { event: options.event });
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit };
}
