"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, 
  Settings, LogOut, ChevronRight, Menu, X 
} from "lucide-react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Customers", href: "/admin/users", icon: Users },
];

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* --- MOBILE OVERLAY --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* --- MOBILE TOP BAR --- */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-lg font-black tracking-tighter text-slate-900">
          JERSEY<span className="text-slate-500">SHOP</span>
        </span>
        <button 
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`} 
        aria-label="Sidebar"
      >
        <div className="flex h-full flex-col px-3 py-4">
          {/* Brand / Logo Section */}
          <div className="mb-8 hidden lg:flex items-center px-4">
            <span className="text-xl font-black tracking-tighter text-slate-900">
              JERSEY<span className="text-slate-500">SHOP</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 mt-14 lg:mt-0">
            <ul className="space-y-2 font-medium">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                
                // --- IMPROVED ACTIVE LOGIC ---
                // 1. For dashboard ("/admin"), use strict equality so it doesn't match everything.
                // 2. For others, check if the pathname starts with the href (e.g. /admin/products/new starts with /admin/products)
                const isActive = item.href === "/admin" 
                  ? pathname === "/admin" 
                  : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={14} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto border-t border-slate-100 pt-4">
            <Link
              href="/admin/settings"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                pathname.startsWith("/admin/settings") 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Settings size={20} className={pathname.startsWith("/admin/settings") ? "text-white" : "text-slate-400"} />
              <span>Settings</span>
            </Link>
            
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
