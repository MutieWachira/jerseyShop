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
      {/* Added 'inset-0' and fixed height to ensure it covers the whole screen on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* --- MOBILE TOP BAR --- */}
      {/* Added 'h-16' for a consistent height to reference in your page paddings (pt-16) */}
      <div className="fixed top-0 left-0 right-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:hidden">
        <span className="text-lg font-black tracking-tighter text-slate-900">
          JERSEY<span className="text-slate-500">SHOP</span>
        </span>
        <button 
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed left-0 top-0 z-40 h-screen w-72 lg:w-64 border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`} 
        aria-label="Sidebar"
      >
        <div className="flex h-full flex-col">
          {/* Brand Section (Desktop Only) */}
          <div className="hidden lg:flex h-20 items-center px-8 border-b border-slate-50">
            <span className="text-xl font-black tracking-tighter text-slate-900">
              JERSEY<span className="text-slate-500">SHOP</span>
            </span>
          </div>

          {/* Navigation - Added 'overflow-y-auto' for small screens with many items */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide mt-16 lg:mt-0">
            <ul className="space-y-2 font-medium">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/admin" 
                  ? pathname === "/admin" 
                  : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all active:scale-[0.98] ${
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
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Link
              href="/admin/settings"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                pathname.startsWith("/admin/settings") 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition active:scale-95"
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
