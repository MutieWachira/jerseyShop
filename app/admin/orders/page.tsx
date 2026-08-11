"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Eye,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type ConnectionState = "connecting" | "live" | "polling" | "offline";

interface OrderItem {
  id:         number;
  quantity:   number;
  unitPrice:  number;
  totalPrice: number;
  product:    { id: number; name: string; image: string; team: string };
  variant:    { size: string; version: string };
}

interface Order {
  id:        string;
  total:     number;
  status:    OrderStatus;
  createdAt: string;
  user:      { id: string; name: string | null; email: string | null };
  items:     OrderItem[];
}

interface Pagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:    ["PAID", "CANCELLED"],
  PAID:       ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED:     ["SHIPPED", "CANCELLED"],
  SHIPPED:    ["DELIVERED"],
  DELIVERED:  [],
  CANCELLED:  [],
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:    "bg-amber-50   text-amber-600   border-amber-200",
  PAID:       "bg-blue-50    text-blue-600    border-blue-200",
  PROCESSING: "bg-slate-50   text-slate-600   border-slate-200",
  PACKED:     "bg-cyan-50    text-cyan-600    border-cyan-200",
  SHIPPED:    "bg-violet-50  text-violet-600  border-violet-200",
  DELIVERED:  "bg-emerald-50 text-emerald-600 border-emerald-200",
  CANCELLED:  "bg-rose-50    text-rose-600    border-rose-200",
};

const POLL_INTERVAL_MS = 15_000; // polling fallback: every 15 seconds
const SSE_RETRY_DELAY  =  5_000; // wait 5s before retrying SSE connection

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, flash = false }: { status: OrderStatus; flash?: boolean }) {
  return (
    <span className={`
      px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all
      ${STATUS_STYLES[status]}
      ${flash ? "ring-2 ring-offset-1 ring-slate-400 scale-105" : ""}
    `}>
      {status}
    </span>
  );
}

// ─── Connection Indicator ─────────────────────────────────────────────────────

function ConnectionIndicator({
  state,
  onRefresh,
}: {
  state: ConnectionState;
  onRefresh: () => void;
}) {
  const config = {
    connecting: { icon: <Loader2 size={12} className="animate-spin" />, label: "Connecting...", style: "text-slate-400" },
    live:       { icon: <Wifi     size={12} />,                          label: "Live",          style: "text-emerald-600" },
    polling:    { icon: <RefreshCw size={12} className="animate-spin" />,label: "Auto-refresh",  style: "text-blue-500" },
    offline:    { icon: <WifiOff  size={12} />,                          label: "Offline",       style: "text-rose-500" },
  }[state];

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide ${config.style}`}>
        {config.icon}
        {config.label}
      </div>
      <button
        onClick={onRefresh}
        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
        title="Refresh now"
      >
        <RefreshCw size={12} />
      </button>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderModal({
  order,
  onClose,
  onStatusUpdate,
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const [updating,       setUpdating]       = useState(false);
  const [currentStatus,  setCurrentStatus]  = useState<OrderStatus>(order.status);
  const allowed = STATUS_TRANSITIONS[currentStatus];

  // Sync if parent updates the order (e.g. via SSE)
  useEffect(() => {
    setCurrentStatus(order.status);
  }, [order.status]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setUpdating(true);
    await onStatusUpdate(order.id, newStatus);
    setCurrentStatus(newStatus);
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Details</p>
            <h2 className="mt-1 text-lg font-black text-slate-900 font-mono">#{order.id.slice(-8).toUpperCase()}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(order.createdAt).toLocaleDateString("en-KE", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Customer</p>
            <p className="text-sm font-bold text-slate-900">{order.user.name || "—"}</p>
            <p className="text-sm text-slate-500">{order.user.email || "—"}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Status</p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={currentStatus} />
              {allowed.length > 0 && (
                <>
                  <span className="text-xs text-slate-400 font-bold">→ Move to:</span>
                  {allowed.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={updating}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition hover:opacity-80 disabled:opacity-40 ${STATUS_STYLES[s]}`}
                    >
                      {updating ? <Loader2 size={10} className="animate-spin" /> : s}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Items</p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3">
                  <img
                    src={item.product.image || "/placeholder-jersey.png"}
                    alt={item.product.name}
                    className="h-14 w-14 rounded-xl object-cover border border-slate-100 bg-slate-50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{item.product.team}</p>
                    <div className="mt-1 flex gap-2">
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.variant.size}</span>
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.variant.version}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">Ksh {item.unitPrice.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">×{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center rounded-2xl bg-slate-900 text-white p-4">
            <p className="text-sm font-black uppercase tracking-wide">Order Total</p>
            <p className="text-xl font-black">Ksh {order.total.toLocaleString()}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [pagination,    setPagination]    = useState<Pagination | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [connection,    setConnection]    = useState<ConnectionState>("connecting");
  const [flashIds,      setFlashIds]      = useState<Set<string>>(new Set());

  // Filters
  const [searchInput,  setSearchInput]  = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);

  // Refs — stable references that don't cause re-renders
  const sseRef        = useRef<EventSource | null>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted     = useRef(true);

  // ── Fetch orders ──
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page",  String(page));
      params.set("limit", "20");

      const res = await axios.get(`/api/admin/orders?${params.toString()}`);
      if (!isMounted.current) return;
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Fetch orders error:", err);
      if (!isMounted.current) return;
      setOrders([]);
    } finally {
      if (!isMounted.current) return;
      if (!silent) setLoading(false);
    }
  }, [search, statusFilter, page]);

  // ── Flash an order row briefly when its status changes ──
  const flashOrder = (orderId: string) => {
    setFlashIds((prev) => new Set(prev).add(orderId));
    setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }, 2000);
  };

  // ── Apply SSE update to local state ──
  const applyStatusUpdate = useCallback((orderId: string, status: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: status as OrderStatus } : o
      )
    );
    setSelectedOrder((prev) =>
      prev?.id === orderId ? { ...prev, status: status as OrderStatus } : prev
    );
    flashOrder(orderId);
  }, []);

  // ── Start polling fallback ──
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setConnection("polling");
    pollRef.current = setInterval(() => {
      fetchOrders(true); // silent = true — no loading spinner
    }, POLL_INTERVAL_MS);
  }, [fetchOrders]);

  // ── Stop polling ──
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // ── Connect SSE ──
  const connectSSE = useCallback(() => {
    // Close any existing connection first
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }

    setConnection("connecting");

    const sse = new EventSource("/api/admin/orders/stream");
    sseRef.current = sse;

    sse.onopen = () => {
      if (!isMounted.current) return;
      setConnection("live");
      stopPolling(); // SSE is live — stop polling fallback
    };

    sse.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ORDER_UPDATE") {
          applyStatusUpdate(data.orderId, data.status);
        }
        // CONNECTED message — no action needed
      } catch {
        // ignore parse errors
      }
    };

    sse.onerror = () => {
      if (!isMounted.current) return;
      sse.close();
      sseRef.current = null;
      setConnection("polling");

      // Start polling as fallback
      startPolling();

      // Retry SSE after a delay
      retryRef.current = setTimeout(() => {
        if (isMounted.current) connectSSE();
      }, SSE_RETRY_DELAY);
    };
  }, [applyStatusUpdate, startPolling]);

  // ── Initial load ──
  useEffect(() => {
    isMounted.current = true;
    fetchOrders();
    connectSSE();

    return () => {
      isMounted.current = false;
      sseRef.current?.close();
      stopPolling();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-fetch when filters/page change ──
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Manual status update (admin clicks Update button) ──
  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    try {
      await axios.patch(`/api/admin/orders/${id}`, { status });
      applyStatusUpdate(id, status);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update status";
      alert(msg);
    }
  };

  // ── Manual refresh ──
  const handleManualRefresh = () => fetchOrders(false);

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <AdminSidebar />

      <main className="flex-1 lg:ml-64 p-8 lg:p-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Orders</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {pagination ? `${pagination.total} total orders` : "Manage customer orders"}
            </p>
          </div>
          {/* Connection status indicator */}
          <ConnectionIndicator state={connection} onRefresh={handleManualRefresh} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID, name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 animate-pulse">
            <ShoppingBag />
            <span className="font-bold uppercase tracking-widest text-xs">Loading orders...</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Items</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          flashIds.has(order.id) ? "bg-emerald-50/50" : ""
                        }`}
                      >
                        <td className="p-6">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                        </td>

                        <td className="p-6">
                          <p className="text-sm font-bold text-slate-900">{order.user.name || "—"}</p>
                          <p className="text-xs text-slate-400">{order.user.email || "—"}</p>
                        </td>

                        <td className="p-6 text-sm text-slate-500 font-medium">
                          {new Date(order.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>

                        <td className="p-6 text-sm font-bold text-slate-700">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>

                        <td className="p-6 text-sm font-black text-slate-900">
                          Ksh {order.total.toLocaleString()}
                        </td>

                        <td className="p-6">
                          <StatusBadge
                            status={order.status}
                            flash={flashIds.has(order.id)}
                          />
                        </td>

                        <td className="p-6">
                          <div className="flex justify-end gap-2">
                            {((STATUS_TRANSITIONS[order.status] ?? []) as OrderStatus[]).length > 0 && (
                              <div className="relative group">
                                <button className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition text-xs font-black flex items-center gap-1">
                                  Update <ChevronDown size={12} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg z-10 overflow-hidden hidden group-hover:block min-w-[130px]">
                                  {((STATUS_TRANSITIONS[order.status] ?? []) as OrderStatus[]).map((s) => {
                                    const style = STATUS_STYLES[s] ?? "bg-slate-50 text-slate-600 border-slate-200";
                                    const badge = style.split(" ")[1] ?? "text-slate-600";
                                    return (
                                      <button
                                        key={s}
                                        onClick={() => handleStatusUpdate(order.id, s)}
                                        className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase hover:bg-slate-50 transition ${badge}`}
                                      >
                                        {s}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                              title="View Order"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag size={48} className="text-slate-200" />
                          <p className="text-slate-400 font-bold">No orders found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-black text-slate-900 px-2">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}