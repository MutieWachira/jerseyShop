"use client";

import { useSession } from "next-auth/react";
import DashboardCard from "./components/DashboardCard";
import RecentOrders from "./components/RecentOrders";
import AdminSidebar from "./components/AdminSidebar"; // Import your new component
import { Bell } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      {/* 1. Sidebar - Now using your official component */}
      <AdminSidebar />

      {/* 2. Main Content Area - Added ml-64 to push content past the fixed sidebar */}
      <main className="flex-1 flex flex-col lg:ml-64">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8">
          <div className="text-sm font-medium text-slate-500">
            Welcome back, <span className="text-slate-900 font-bold">{session?.user?.name || "Admin"}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-900 transition relative">
              <Bell size={20}/>
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{session?.user?.name || "Admin User"}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Administrator</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-slate-200">
                {session?.user?.name?.[0] || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 max-w-7xl w-full">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Monitor your shop's performance and recent activity.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <DashboardCard title="Total Sales" value="Ksh 0" />
            <DashboardCard title="Total Orders" value="0" />
            <DashboardCard title="Products" value="0" />
            <DashboardCard title="Active Users" value="0" />
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-lg font-black text-slate-900">Recent Transactions</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Last 10 orders</p>
              </div>
              <button className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition">
                View All
              </button>
            </div>
            
            <div className="p-4">
              <RecentOrders />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
