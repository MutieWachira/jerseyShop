"use client"

import AdminSidebar from "@/app/admin/components/AdminSidebar";

export default function AdminLayout ({ children }: { children: React.ReactNode }) {
    return(
        <div className="flex min-h-screen bg-slate-100"  suppressHydrationWarning={true}>
            <AdminSidebar />

            <div className=" flex-1 p-8">
                {children}
            </div>
        </div>
    );
}