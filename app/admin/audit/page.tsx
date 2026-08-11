"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import Link from "next/link";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  event: string;
  resource: string;
  description: string;
  ip: string;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [resource, setResource] = useState("");
  const [event, setEvent] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "30",
    });
    if (resource) params.set("resource", resource);
    if (event) params.set("event", event);

    const res = await fetch(`/api/admin/audit?${params.toString()}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, resource, event]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar />
      <main className="lg:ml-64 p-6">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Audit Logs</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Immutable, queryable logs for admin activity, including who accessed what, from where, and when.
              </p>
            </div>
            <Link
              href="/admin/categories"
              className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Back to Categories
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] mb-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Resource</span>
                <input
                  value={resource}
                  onChange={(event) => setResource(event.target.value)}
                  placeholder="categories"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Event</span>
                <input
                  value={event}
                  onChange={(event) => setEvent(event.target.value)}
                  placeholder="VIEW_CATEGORIES"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <div className="flex items-end">
                <button
                  onClick={() => setPage(1)}
                  className="w-full rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Total records</p>
            <p className="mt-4 text-3xl font-black text-slate-900">{total}</p>
            <p className="mt-2 text-sm text-slate-500">Page {page} / {Math.max(1, Math.ceil(total / 30))}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-24 rounded-[1.75rem] bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
              No audit entries found for the current filter.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{log.event}</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{log.resource}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{new Date(log.createdAt).toLocaleString()}</p>
                      <p className="mt-1">User: {log.userId ?? "System"}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <p className="text-sm text-slate-600">{log.description}</p>
                    <div className="space-y-1 text-sm text-slate-500">
                      <p><span className="font-semibold text-slate-700">IP:</span> {log.ip}</p>
                      <p><span className="font-semibold text-slate-700">Agent:</span> {log.userAgent ?? "Unknown"}</p>
                    </div>
                  </div>
                  {Object.keys(log.metadata || {}).length > 0 && (
                    <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                      <pre className="whitespace-pre-wrap break-words">{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={logs.length < 30}
            className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
