import ProductCard from "@/src/components/ProductCard";
import { prisma } from "@/src/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Define the Prisma return type to include the category
type ProductWithCategory = {
  id: number;
  name: string;
  team: string;
  price: number;
  description: string;
  image: string;
  categoryId: string;
  category: { name: string; slug: string };
};

type Props = {
  searchParams: Promise<{
    page?: string;
    team?: string;
    search?: string;
    sort?: string;
    category?: string;
  }>;
};

export default async function ShopPage({ searchParams }: Props) {
  // ✅ FIX: Unwrapping the searchParams Promise
  const resolvedParams = await searchParams;

  const page = Math.max(1, parseInt(resolvedParams?.page || "1") || 1);
  const teamFilter = resolvedParams?.team || undefined;
  const searchQuery = resolvedParams?.search || "";
  const sort = resolvedParams?.sort || "newest";
  const categorySlug = resolvedParams?.category || undefined;

  const pageSize = 8;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-low") orderBy = { price: "asc" };
  if (sort === "price-high") orderBy = { price: "desc" };

  const where: any = {
    ...(teamFilter && { team: teamFilter }),
    ...(searchQuery && {
      name: { contains: searchQuery, mode: "insensitive" },
    }),
    ...(categorySlug && {
      category: { slug: categorySlug },
    }),
  };

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalProducts / pageSize);

  // Improvement: Get the display name from the first product if filtering by category
  const displayCategoryName = categorySlug && products.length > 0 
    ? products[0].category.name 
    : categorySlug?.replace(/-/g, " ");

  const buildQuery = (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return `?${query.toString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
              {categorySlug ? displayCategoryName : "Shop Jerseys"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {categorySlug
                ? `Showing our best ${displayCategoryName} collection`
                : "Browse our latest football jerseys."}
            </p>
          </div>
          <p className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm w-fit">
            Showing {products.length} of {totalProducts} items
          </p>
        </div>

        {/* SEARCH + SORT */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form action="/shop" className="flex flex-1 max-w-md gap-2">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search jerseys..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
            {teamFilter && <input type="hidden" name="team" value={teamFilter} />}
            {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            <button className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
              Search
            </button>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {[
              { label: "Newest", val: "newest" },
              { label: "Price ↑", val: "price-low" },
              { label: "Price ↓", val: "price-high" },
            ].map((s) => (
              <Link
                key={s.val}
                href={`/shop${buildQuery({
                  sort: s.val,
                  team: teamFilter,
                  category: categorySlug,
                  search: searchQuery,
                })}`}
                className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm transition-colors ${
                  sort === s.val
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* TEAM FILTER */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/shop${buildQuery({ category: categorySlug, search: searchQuery, sort })}`}
            className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${
              !teamFilter ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"
            }`}
          >
            All Teams
          </Link>
          {["Arsenal", "Barcelona", "Real Madrid", "Juventus"].map((team) => (
            <Link
              key={team}
              href={`/shop${buildQuery({ team, category: categorySlug, search: searchQuery, sort })}`}
              className={`rounded-full px-4 py-1.5 text-xs border transition-colors ${
                team === teamFilter
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 hover:border-slate-400"
              }`}
            >
              {team}
            </Link>
          ))}
        </div>

        {/* PRODUCTS */}
        {products.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                image={product.image || "/placeholder.png"}
              />
            ))}
          </div>
        ) : (
          <div className="mt-20 text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-lg text-slate-500">No jerseys found.</p>
            <Link href="/shop" className="text-slate-900 underline font-bold mt-2 inline-block">
              Clear all filters
            </Link>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/shop${buildQuery({
                  page: p,
                  team: teamFilter,
                  search: searchQuery,
                  sort,
                  category: categorySlug,
                })}`}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-colors ${
                  p === page ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
