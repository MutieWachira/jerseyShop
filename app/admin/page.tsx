"use client";

import { useSession } from "next-auth/react";
import DashboardCard from "./components/DashboardCard";
import RecentOrders from "./components/RecentOrders";
import AdminSidebar from "./components/AdminSidebar"; 
import { Bell } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 1. Sidebar - Fixed on desktop, toggleable on mobile */}
      <AdminSidebar />

      {/* 2. Main Content Area */}
      {/* lg:ml-64 matches sidebar width. pt-16 accounts for mobile header */}
      <main className="flex-1 flex flex-col lg:ml-64 pt-16 lg:pt-0 min-w-0">
        
        {/* Top Navbar - Sticky and responsive */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
          <div className="text-sm font-medium text-slate-500 hidden sm:block">
            Welcome back, <span className="text-slate-900 font-bold">{session?.user?.name || "Admin"}</span>
          </div>
          
          {/* On mobile, welcome text is hidden to save space */}
          <div className="sm:hidden text-xs font-bold text-slate-400 uppercase tracking-widest">
            Dashboard
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-900 transition relative">
              <Bell size={20}/>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-100">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{session?.user?.name || "Admin User"}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Administrator</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-slate-200 shrink-0">
                {session?.user?.name?.[0] || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto">
          <div className="mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Overview</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Monitor your shop's performance and recent activity.</p>
          </div>

          {/* Stats Grid - Responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
            <DashboardCard title="Total Sales" value="Ksh 0" />
            <DashboardCard title="Total Orders" value="0" />
            <DashboardCard title="Products" value="0" />
            <DashboardCard title="Active Users" value="0" />
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-5 md:px-8 md:py-6 border-b border-slate-50 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-900 leading-tight">Recent Transactions</h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase mt-1">Last 10 orders</p>
              </div>
              <button className="bg-slate-50 text-slate-600 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition whitespace-nowrap">
                View All
              </button>
            </div>
            
            {/* Added overflow-x-auto to handle tables on small screens */}
            <div className="p-2 md:p-4 overflow-x-auto">
              <RecentOrders />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
