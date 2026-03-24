import Link from "next/link";
import { prisma } from "@/src/lib/prisma";

export default async function CategoriesPage() {
  // Improvement: Include product count so users see which categories have stock
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Empty state handling
  if (categories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">No categories found.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-10 tracking-tight">
          Jersey Categories
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              // Debug: Fallback to ID if slug is missing during migration period
              href={`/shop?category=${category.slug || category.id}`}
              className="group rounded-2xl border border-slate-200 p-6 hover:border-blue-500 hover:shadow-md transition-all duration-200 bg-slate-50/50"
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Browse our full collection of {category.name} jerseys.
                  </p>
                </div>
                
                {/* Improvement: Badge showing item count */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                     {category._count.products} Products
                   </span>
                   <span className="text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                     View All →
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
