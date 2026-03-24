import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// ─── In-memory client registry ────────────────────────────────────────────────
// Keeps track of all connected admin browsers so we can broadcast to all of them.
// On Vercel each serverless invocation is isolated, so this works per-instance.
// For multi-instance prod you'd use Redis pub/sub — overkill for this scale.

type SSEClient = {
  id:         string;
  controller: ReadableStreamDefaultController;
};

const clients = new Set<SSEClient>();

// ─── Broadcast helper — called from payment callbacks ─────────────────────────
// Other route handlers import and call this when an order status changes.

export function broadcastOrderUpdate(orderId: string, status: string) {
  const payload = JSON.stringify({ type: "ORDER_UPDATE", orderId, status });
  for (const client of clients) {
    try {
      client.controller.enqueue(`data: ${payload}\n\n`);
    } catch {
      // Client disconnected — remove from set
      clients.delete(client);
    }
  }
}

// ─── GET /api/admin/orders/stream ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      const client: SSEClient = { id: clientId, controller };
      clients.add(client);

      // Send initial connection confirmation
      controller.enqueue(`data: ${JSON.stringify({ type: "CONNECTED", clientId })}\n\n`);

      // Send a heartbeat every 25 seconds to keep the connection alive
      // (Vercel times out idle connections after 30s)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch {
          clearInterval(heartbeat);
          clients.delete(client);
        }
      }, 25_000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clients.delete(client);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":                "text/event-stream",
      "Cache-Control":               "no-cache, no-transform",
      "Connection":                  "keep-alive",
      "X-Accel-Buffering":           "no", // disables Nginx buffering on Vercel
      "Access-Control-Allow-Origin": "*",
    },
  });
}