"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/src/context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, LogOut, Menu, X, Search } from "lucide-react";

type NavLinkProps = {
  href: string;
  label: string;
  onClick?: () => void;
};

function NavLink({ href, label, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
        isActive
          ? "bg-slate-900 text-white shadow-md shadow-slate-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart } = useCart();
  const { data: session, status } = useSession();
  const loading = status === "loading";

  // FIX: Automatically close mobile menu when path changes
  useEffect(() => setMenuOpen(false), [pathname]);

  // DEBUG: Hide the main navbar if we are in the admin dashboard
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const totalItems = (cart ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter text-slate-900"
            >
              Jersey<span className="text-slate-400">Shop</span>
            </Link>
</div>
            {/* Desktop Nav Links */}
            <div className="hidden items-center gap-1 lg:flex">
              <NavLink href="/" label="Home" />
              <NavLink href="/shop" label="Shop" />
              <NavLink href="/categories" label="Categories" />
            </div>
          

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Search - Visual Improvement */}
            <button className="p-2 text-slate-400 hover:text-slate-900 transition">
              <Search size={20} />
            </button>

            {/* Cart Link */}
            <Link
              href="/cart"
              className="group relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              <ShoppingCart size={18} className="text-slate-400 group-hover:text-slate-900" />
              <span className="hidden lg:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            {/* Auth Toggle */}
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-2xl bg-slate-100" />
            ) : session ? (
              <div className="flex items-center gap-2">
                <Link
                  href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  <User size={16} />
                  <span>{session.user.name?.split(" ")[0]}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-2xl bg-slate-900 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 active:scale-95"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-900 md:hidden active:scale-90 transition-transform"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            menuOpen ? "max-h-[400px] opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-2 rounded-3xl border border-slate-100 bg-slate-50/50 p-4 shadow-inner">
            <NavLink href="/" label="Home" />
            <NavLink href="/shop" label="Shop" />
            <NavLink href="/categories" label="Categories" />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-900"
              >
                <ShoppingCart size={16} />
                Cart ({totalItems})
              </Link>

              {session ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 text-sm font-bold text-rose-600"
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
