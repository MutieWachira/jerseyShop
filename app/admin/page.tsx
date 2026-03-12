"use client";

import DashboardCard from "./components/DashboardCard";
import RecentOrders from "./components/RecentOrders";
import AdminHeader from "./components/AdminHeader";

export default function AdminDashboard() {
  return (

    <div>

      <AdminHeader />

      <div className="grid md:grid-cols-4 gap-6 mb-10">

        <DashboardCard title="Total Sales" value="Ksh 0" />
        <DashboardCard title="Orders" value="0" />
        <DashboardCard title="Products" value="0" />
        <DashboardCard title="Users" value="0" />

      </div>

      <RecentOrders />

    </div>

  );
}