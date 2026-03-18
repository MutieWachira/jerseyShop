"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Eye,
  X,
  ShoppingBag,
  Star,
  ShoppingCart,
  Shield,
  User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "USER" | "ADMIN";
type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface UserSummary {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  createdAt: string;
  _count: { orders: number; reviews: number; cartItems: number };
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: { id: number; name: string; image: string; team: string };
  variant: { size: string; version: string };
}

interface UserOrder {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

interface UserReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  product: { id: number; name: string; image: string };
}

interface UserDetail extends UserSummary {
  orders: UserOrder[];
  reviews: UserReview[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   "bg-amber-50   text-amber-600   border-amber-200",
  PAID:      "bg-blue-50    text-blue-600    border-blue-200",
  SHIPPED:   "bg-violet-50  text-violet-600  border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-rose-50    text-rose-600    border-rose-200",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, image, size = "md" }: { name: string | null; image: string | null; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  const initials = name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "?";

  if (image) {
    return <img src={image} alt={name || "User"} className={`${dims} rounded-full object-cover border border-slate-100`} />;
  }

  return (
    <div className={`${dims} rounded-full bg-slate-900 text-white flex items-center justify-center font-black shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
      role === "ADMIN"
        ? "bg-slate-900 text-white border-slate-900"
        : "bg-slate-100 text-slate-600 border-slate-200"
    }`}>
      {role === "ADMIN" ? <Shield size={10} /> : <User size={10} />}
      {role}
    </span>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserModal({
  userId,
  onClose,
  onRoleUpdate,
  currentAdminId,
}: {
  userId: string;
  onClose: () => void;
  onRoleUpdate: (id: string, role: Role) => Promise<void>;
  currentAdminId: string;
}) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "reviews">("orders");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/admin/users/${userId}`);
        setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleRoleToggle = async () => {
    if (!user) return;
    const newRole: Role = user.role === "ADMIN" ? "USER" : "ADMIN";
    setUpdatingRole(true);
    await onRoleUpdate(user.id, newRole);
    setUser((prev) => (prev ? { ...prev, role: newRole } : prev));
    setUpdatingRole(false);
  };

  const isSelf = user?.id === currentAdminId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">User Profile</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : user ? (
          <div className="p-6 space-y-6">

            {/* Profile */}
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <Avatar name={user.name} image={user.image} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-slate-900">{user.name || "No name"}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Joined {new Date(user.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <RoleBadge role={user.role} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                <ShoppingBag size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="text-2xl font-black text-slate-900">{user._count.orders}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Orders</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                <Star size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="text-2xl font-black text-slate-900">{user._count.reviews}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Reviews</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                <ShoppingCart size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="text-2xl font-black text-slate-900">{user._count.cartItems}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">In Cart</p>
              </div>
            </div>

            {/* Role Management */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Role Management</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {user.role === "ADMIN" ? "This user is an Admin" : "This user is a Customer"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user.role === "ADMIN"
                      ? "Has full access to the admin panel"
                      : "Standard shop access only"}
                  </p>
                </div>
                <button
                  onClick={handleRoleToggle}
                  disabled={updatingRole || isSelf}
                  title={isSelf ? "You cannot change your own role" : undefined}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition disabled:opacity-40 ${
                    user.role === "ADMIN"
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {updatingRole ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : user.role === "ADMIN" ? (
                    "Demote to User"
                  ) : (
                    "Promote to Admin"
                  )}
                </button>
              </div>
              {isSelf && (
                <p className="mt-2 text-[10px] text-slate-400 font-bold">You cannot change your own role.</p>
              )}
            </div>

            {/* Tabs — Orders / Reviews */}
            <div>
              <div className="flex border-b border-slate-100 mb-4">
                {(["orders", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wide transition border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab} ({tab === "orders" ? user._count.orders : user._count.reviews})
                  </button>
                ))}
              </div>

              {activeTab === "orders" && (
                <div className="space-y-3">
                  {user.orders.length === 0 ? (
                    <p className="text-sm text-slate-400 font-bold text-center py-6">No orders yet</p>
                  ) : (
                    user.orders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${ORDER_STATUS_STYLES[order.status]}`}>
                              {order.status}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              Ksh {order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5">
                              <img
                                src={item.product.image || "/placeholder-jersey.png"}
                                alt={item.product.name}
                                className="h-6 w-6 rounded-lg object-cover"
                              />
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                                {item.product.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {item.variant.size} · {item.variant.version} · ×{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(order.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    ))
                  )}
                  {user._count.orders > 10 && (
                    <p className="text-center text-xs text-slate-400 font-bold pt-1">
                      Showing last 10 of {user._count.orders} orders
                    </p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-3">
                  {user.reviews.length === 0 ? (
                    <p className="text-sm text-slate-400 font-bold text-center py-6">No reviews yet</p>
                  ) : (
                    user.reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={review.product.image || "/placeholder-jersey.png"}
                            alt={review.product.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-100"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{review.product.name}</p>
                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(review.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-bold">User not found</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  // Get current admin session id to prevent self-demotion in the table too
  useEffect(() => {
    const getSession = async () => {
      try {
        const res = await axios.get("/api/auth/session");
        setCurrentAdminId(res.data?.user?.id || "");
      } catch (_) {}
    };
    getSession();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await axios.get(`/api/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Fetch users error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleUpdate = async (id: string, role: Role) => {
    try {
      await axios.patch(`/api/admin/users/${id}`, { role });
      // Update local state without re-fetch
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u))
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update role";
      alert(msg);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <AdminSidebar />

      <main className="flex-1 lg:ml-64 p-8 lg:p-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Users</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {pagination ? `${pagination.total} registered users` : "Manage customers and admins"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">

          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 animate-pulse">
            <Users />
            <span className="font-bold uppercase tracking-widest text-xs">Loading users...</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Orders</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Reviews</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition">

                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} image={user.image} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{user.name || "—"}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-6">
                          <RoleBadge role={user.role} />
                        </td>

                        <td className="p-6 text-center">
                          <span className="text-sm font-black text-slate-900">{user._count.orders}</span>
                        </td>

                        <td className="p-6 text-center">
                          <span className="text-sm font-black text-slate-900">{user._count.reviews}</span>
                        </td>

                        <td className="p-6 text-sm text-slate-500 font-medium">
                          {new Date(user.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>

                        <td className="p-6">
                          <div className="flex justify-end gap-2">

                            {/* Quick role toggle */}
                            {user.id !== currentAdminId && (
                              <button
                                onClick={() =>
                                  handleRoleUpdate(
                                    user.id,
                                    user.role === "ADMIN" ? "USER" : "ADMIN"
                                  )
                                }
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition border ${
                                  user.role === "ADMIN"
                                    ? "bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100"
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                }`}
                                title={user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
                              >
                                {user.role === "ADMIN" ? "Demote" : "Promote"}
                              </button>
                            )}

                            {/* View details */}
                            <button
                              onClick={() => setSelectedUserId(user.id)}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                              title="View User"
                            >
                              <Eye size={18} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={48} className="text-slate-200" />
                          <p className="text-slate-400 font-bold">No users found.</p>
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

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRoleUpdate={handleRoleUpdate}
          currentAdminId={currentAdminId}
        />
      )}
    </div>
  );
}