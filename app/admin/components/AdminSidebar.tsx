"use client";

import Link from "next/link";

export default function AdminSidebar() {
    return (
        <aside className="w-64 bg-white border-r border-slate-200">
            <h2 className="text-xl font-bold mb-8">Admin Dashboard</h2>
            <nav className="space-y-4">
                <Link href="/admin" className="block text-slate-700 hover:text-black font-medium">
                Dashboard
                </Link>
                <Link href="/admin/products" className="block text-slate-700 hover:text-black font-medium">
                Products
                </Link><Link href="/admin/orders" className="block text-slate-700 hover:text-black font-medium">
                Orders
                </Link><Link href="/admin/users" className="block text-slate-700 hover:text-black font-medium">
                Users
                </Link>
            </nav>
        </aside>
    );
}