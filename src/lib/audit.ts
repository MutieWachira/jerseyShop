import { prisma } from "./prisma";

type AuditLevel = "INFO" | "WARN" | "ERROR";

export async function auditLog(params: {
  actorId?: string | null;
  actorType?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  level?: AuditLevel;
  metadata?: any;
}) {
  const { actorId, actorType, action, resourceType, resourceId, level = "INFO", metadata } = params;
  try {
    // best-effort: do not throw or block main flows
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? undefined,
        actorType: actorType ?? undefined,
        action,
        resourceType: resourceType ?? undefined,
        resourceId: resourceId ?? undefined,
        level: level as any,
        metadata: metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("[AUDIT] failed to write audit log", { action, resourceType, resourceId, err });
  }
}

export default auditLog;
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import type { Prisma } from "@prisma/client";

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
        actorId: userId ?? undefined,
        actorType: userId ? "USER" : undefined,
        action: payload.event,
        resourceType: payload.resource,
        resourceId: undefined,
        metadata: payload.metadata ? (payload.metadata as Prisma.JsonObject) : {},
        // attach request metadata
        // store IP and userAgent inside metadata object for backward compatibility
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
  resourceType?: string;
  action?: string;
}) {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const where: Record<string, unknown> = {};

  if (options.resourceType) {
    Object.assign(where, { resourceType: options.resourceType });
  }

  if (options.action) {
    Object.assign(where, { action: options.action });
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
