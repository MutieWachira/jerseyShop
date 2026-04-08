"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/src/context/CartContext";
import { useWishlist } from "@/src/context/WishlistContext";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, LogOut, Menu, X, Heart, Package } from "lucide-react"; // ✅ Added Package icon

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
  const { wishlist } = useWishlist();
  const { data: session, status } = useSession();
  const loading = status === "loading";

  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const totalItems = (cart ?? []).reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist?.length || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900">
              Jersey<span className="text-slate-400">Shop</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/" label="Home" />
              <NavLink href="/shop" label="Shop" />
              <NavLink href="/categories" label="Categories" />
              {/* ✅ Orders link: Desktop (Visible only when logged in) */}
              {session && <NavLink href="/orders" label="Orders" />}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/wishlist"
              className="group relative p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Heart size={20} fill={wishlistCount > 0 ? "currentColor" : "none"} />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="group relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-900"
            >
              <ShoppingCart size={18} />
              <span className="hidden md:inline ml-2">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <div className="hidden md:block h-6 w-px bg-slate-200 mx-1" />

            {!loading && (
              session ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link 
                    href={session.user?.role === "ADMIN" ? "/admin" : "/shop"} 
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                  >
                     <User size={16} />
                     <span className="hidden lg:inline">
                       {session.user.name?.split(" ")[0]}
                     </span>
                  </Link>
                  <button 
                    onClick={() => signOut()} 
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="hidden md:block rounded-2xl bg-slate-900 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  Login
                </Link>
              )
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-900"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            menuOpen ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-2 rounded-3xl border border-slate-100 bg-slate-50/50 p-4 shadow-inner">
            <NavLink href="/" label="Home" />
            <NavLink href="/shop" label="Shop" />
            <NavLink href="/categories" label="Categories" />
            <NavLink href="/wishlist" label={`Wishlist (${wishlistCount})`} />
            {/* ✅ Orders link: Mobile (Visible only when logged in) */}
            {session && <NavLink href="/orders" label="My Orders" />}

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
