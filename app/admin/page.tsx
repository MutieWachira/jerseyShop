"use client";

import { signOut } from "next-auth/react";
import DashboardCard from "./components/DashboardCard";
import RecentOrders from "./components/RecentOrders";
import AdminHeader from "./components/AdminHeader";
import { LogOut, LayoutDashboard, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Navigation / Header Area */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-2 rounded-lg">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Console</h1>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 border border-rose-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 font-medium">Welcome back! Here is what's happening with your shop today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="relative group">
            <DashboardCard title="Total Sales" value="Ksh 0" />
            <TrendingUp className="absolute right-4 top-4 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="relative group">
            <DashboardCard title="Orders" value="0" />
            <ShoppingBag className="absolute right-4 top-4 text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="relative group">
            <DashboardCard title="Products" value="0" />
            <LayoutDashboard className="absolute right-4 top-4 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="relative group">
            <DashboardCard title="Users" value="0" />
            <Users className="absolute right-4 top-4 text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Tables Area */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
          </div>
          <div className="p-2">
            <RecentOrders />
          </div>
        </div>
      </main>
    </div>
  );
}
