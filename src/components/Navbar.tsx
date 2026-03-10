"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/src/context/CartContext";

type NavLinkProps = {
  href: string;
  label: string;
  onClick?: () => void;
};

function NavLink({ href, label, onClick }: NavLinkProps) {
  const pathname = usePathname();

  // Fix active logic
  let isActive = false;
  if (href === "/") {
    isActive = pathname === "/";
  } else {
    isActive = pathname.startsWith(href);
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
        isActive
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart } = useCart();

  const totalItems = (cart ?? []).reduce((sum, item) => sum + item.quantity, 0);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            onClick={closeMenu}
            className="text-2xl font-extrabold tracking-tight text-slate-900"
          >
            Jersey<span className="text-slate-500">Shop</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-2 md:flex">
            <NavLink href="/" label="Home" />
            <NavLink href="/shop" label="Shop" />
            <NavLink href="/categories" label="Categories" />
            <NavLink href="/about" label="About" />
          </div>

          {/* Desktop Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/cart"
              className="relative rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link
              href="/login"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-800 shadow-sm md:hidden focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:hidden transition-all duration-300 ${
            menuOpen ? "opacity-100 max-h-96" : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <div className="flex flex-col gap-3">
            <NavLink href="/" label="Home" onClick={closeMenu} />
            <NavLink href="/shop" label="Shop" onClick={closeMenu} />
            <NavLink href="/categories" label="Categories" onClick={closeMenu} />
            <NavLink href="/about" label="About" onClick={closeMenu} />

            <div className="mt-2 grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                onClick={closeMenu}
                className="relative rounded-2xl border border-slate-200 px-4 py-2 text-center text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Cart
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {totalItems}
                  </span>
                )}
              </Link>

              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-center text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}