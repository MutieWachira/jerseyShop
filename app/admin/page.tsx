"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "./components/AdminSidebar";
import DashboardCard from "./components/DashboardCard";
import RecentOrders from "./components/RecentOrders";
import RevenueChart from "./components/RevenueChart";
import {
  Bell,
  ShoppingBag,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface RecentOrder {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  user: { name: string | null; email: string | null };
  _count: { items: number };
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface DashboardData {
  stats: {
    totalOrders: number;
    totalSales: number;
    totalProducts: number;
    totalUsers: number;
  };
  recentOrders: RecentOrder[];
  monthlySales: MonthlyData[];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get("/api/admin/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <main className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 min-w-0">

        {/* ── Top Navbar ── */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
          <div className="text-sm font-medium text-slate-500 hidden sm:block">
            Welcome back,{" "}
            <span className="text-slate-900 font-bold">{session?.user?.name || "Admin"}</span>
          </div>
          <div className="sm:hidden text-xs font-bold text-slate-400 uppercase tracking-widest">
            Dashboard
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Refresh button */}
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="p-2 text-slate-400 hover:text-slate-900 transition"
              title="Refresh"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>

            <button className="p-2 text-slate-400 hover:text-slate-900 transition relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-100">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-none">
                  {session?.user?.name || "Admin User"}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
                  Administrator
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-slate-200 shrink-0">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* ── Dashboard Content ── */}
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8">

          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                System Overview
              </h2>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Monitor your shop's performance and recent activity.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="hidden sm:inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs font-black hover:bg-slate-800 transition"
            >
              <ShoppingBag size={14} /> View Orders
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-slate-400 animate-pulse py-12">
              <Loader2 className="animate-spin" />
              <span className="font-bold uppercase tracking-widest text-xs">Loading dashboard...</span>
            </div>
          ) : (
            <>
              {/* ── Stats Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard
                  title="Total Sales"
                  value={`Ksh ${(data?.stats.totalSales ?? 0).toLocaleString()}`}
                  icon={TrendingUp}
                  accent="emerald"
                  sub="Excl. cancelled orders"
                />
                <DashboardCard
                  title="Total Orders"
                  value={data?.stats.totalOrders ?? 0}
                  icon={ShoppingBag}
                  accent="blue"
                  sub="All time"
                />
                <DashboardCard
                  title="Products"
                  value={data?.stats.totalProducts ?? 0}
                  icon={Package}
                  accent="violet"
                  sub="In inventory"
                />
                <DashboardCard
                  title="Customers"
                  value={data?.stats.totalUsers ?? 0}
                  icon={Users}
                  accent="slate"
                  sub="Registered users"
                />
              </div>

              {/* ── Chart + Quick Links ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Chart — takes 2/3 width on large screens */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Revenue & Orders</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                        Last 6 months
                      </p>
                    </div>
                  </div>
                  <RevenueChart data={data?.monthlySales ?? []} />
                </div>

                {/* Quick Links — 1/3 width */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
                  <h3 className="text-base font-black text-slate-900 mb-1">Quick Links</h3>

                  {[
                    { href: "/admin/products/add", label: "Add New Jersey",   icon: Package,     accent: "bg-violet-50 text-violet-600" },
                    { href: "/admin/orders",        label: "Manage Orders",   icon: ShoppingBag, accent: "bg-blue-50 text-blue-600" },
                    { href: "/admin/products",      label: "View Inventory",  icon: TrendingUp,  accent: "bg-emerald-50 text-emerald-600" },
                    { href: "/admin/users",         label: "Manage Users",    icon: Users,       accent: "bg-slate-100 text-slate-600" },
                    { href: "/admin/finance",       label: "Finance Center",  icon: DollarSign, accent: "bg-blue-50 text-blue-600" },
                  ].map(({ href, label, icon: Icon, accent }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 hover:bg-slate-50 transition group"
                    >
                      <div className={`p-2 rounded-xl ${accent}`}>
                        <Icon size={15} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition">
                        {label}
                      </span>
                    </Link>
                  ))}
                </div>

              </div>

              {/* ── Recent Orders Table ── */}
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-5 md:px-8 md:py-6 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-900 leading-tight">
                      Recent Transactions
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase mt-1">
                      Last 10 orders
                    </p>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="bg-slate-50 text-slate-600 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-4 md:p-6">
                  <RecentOrders orders={data?.recentOrders ?? []} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}