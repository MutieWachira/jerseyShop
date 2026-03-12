"use client";

import Link from "next/link";

export default function AdminProducts() {
  return (
    <div>

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold">
          Products
        </h1>

        <Link
          href="/admin/products/new"
          className="bg-slate-900 text-white px-5 py-2 rounded-lg"
        >
          Add Product
        </Link>

      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">

        <p className="text-slate-500">
          Product list will appear here
        </p>

      </div>

    </div>
  );
}
