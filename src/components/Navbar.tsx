"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/src/context/CartContext";
import { useSession, signOut } from "next-auth/react"; // 1. Added NextAuth
import { ShoppingCart, User, LogOut, Menu, X, ChevronDown } from "lucide-react"; // 2. Added Icons

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
      className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart } = useCart();
  const { data: session, status } = useSession(); // 3. Get session status
  const loading = status === "loading";

  const totalItems = (cart ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1"
          >
            Jersey<span className="text-slate-400">Shop</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            <NavLink href="/" label="Home" />
            <NavLink href="/shop" label="Shop" />
            <NavLink href="/categories" label="Categories" />
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Cart Link */}
            <Link
              href="/cart"
              className="group relative flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ShoppingCart size={18} className="text-slate-400 group-hover:text-slate-900" />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth Toggle */}
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-2xl bg-slate-100" />
            ) : session ? (
              /* Profile Option when Logged In */
              <div className="flex items-center gap-2">
                <Link
                  href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                  className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-200 transition"
                >
                  <User size={16} />
                  {session.user.name?.split(" ")[0] || "Account"}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              /* Login Option when Logged Out */
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-900 md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            menuOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-2 rounded-3xl border border-slate-100 bg-slate-50/50 p-4">
            <NavLink href="/" label="Home" onClick={() => setMenuOpen(false)} />
            <NavLink href="/shop" label="Shop" onClick={() => setMenuOpen(false)} />
            <NavLink href="/categories" label="Categories" onClick={() => setMenuOpen(false)} />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-900"
              >
                <ShoppingCart size={16} />
                Cart ({totalItems})
              </Link>

              {session ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 py-3 text-sm font-bold text-red-600"
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
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
