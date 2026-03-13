import ProductCard from "@/src/components/ProductCard";
import { prisma } from "@/src/lib/prisma";
import Link from "next/link";

// Force fresh data on every visit
export const dynamic = "force-dynamic";

type Product = {
  id: number;
  name: string;
  team: string;
  price: number;
  description: string;
  image: string;
  categoryId: string;
};

type Props = {
  searchParams: Promise<{
    page?: string;
    team?: string;
    search?: string;
    sort?: string;
  }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = parseInt(params?.page || "1");
  const teamFilter = params?.team || undefined;
  const searchQuery = params?.search || "";
  const sort = params?.sort || "newest";

  const pageSize = 8;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-low") orderBy = { price: "asc" };
  if (sort === "price-high") orderBy = { price: "desc" };

  const where: any = {
    ...(teamFilter ? { team: teamFilter } : {}),
    ...(searchQuery
      ? {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Shop Jerseys
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Browse our latest football jerseys. Find your favorite club's kit.
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
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {teamFilter && (
              <input type="hidden" name="team" value={teamFilter} />
            )}
            <button className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
              Search
            </button>
          </form>

          <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-2 scrollbar-hide">
            {[
              { label: "Newest", val: "newest" },
              { label: "Price ↑", val: "price-low" },
              { label: "Price ↓", val: "price-high" },
            ].map((s) => (
              <Link
                key={s.val}
                href={`/shop?sort=${s.val}${teamFilter ? `&team=${teamFilter}` : ""}`}
                className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  sort === s.val
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
            href="/shop"
            className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              !teamFilter
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            All Teams
          </Link>
          {["Arsenal", "Wolves", "Barcelona", "Real Madrid", "Juventus"].map(
            (team) => (
              <Link
                key={team}
                href={`/shop?team=${team}${sort ? `&sort=${sort}` : ""}`}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  team === teamFilter
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {team}
              </Link>
            ),
          )}
        </div>

        {/* PRODUCTS GRID */}
        {products.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                team={product.team}
                price={product.price}
                description={product.description}
                // Ensure we provide a valid string path
                image={product.image || "/placeholder.png"}
                categoryId={product.categoryId}
              />
            ))}
          </div>
        ) : (
          <div className="mt-20 text-center">
            <p className="text-lg text-slate-500">
              No jerseys found matching your criteria.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-slate-900 font-bold underline"
            >
              Clear all filters
            </Link>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/shop?page=${p}${teamFilter ? `&team=${teamFilter}` : ""}${
                  searchQuery ? `&search=${searchQuery}` : ""
                }${sort ? `&sort=${sort}` : ""}`}
                className={`min-w-[40px] h-[40px] flex items-center justify-center rounded-xl text-sm font-bold transition ${
                  p === page
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
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
