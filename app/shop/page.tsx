import ProductCard from "@/src/components/ProductCard";
import { prisma } from "@/src/lib/prisma";
import Link from "next/link";

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

// server component
export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = parseInt(params?.page || "1");
  const teamFilter = params?.team || undefined;
  const searchQuery = params?.search || "";
  const sort = params?.sort || "newest";

  const pageSize = 8;

  // sorting logic
  let orderBy: any = { createdAt: "desc" };

  if (sort === "price-low") orderBy = { price: "asc" };
  if (sort === "price-high") orderBy = { price: "desc" };

  // build prisma filters
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

  // fetch products
  const products = await prisma.product.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy,
  });

  const totalProducts = await prisma.product.count({ where });

  const totalPages = Math.ceil(totalProducts / pageSize);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-3xl font-extrabold text-slate-900">
          Shop Jerseys
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Browse our latest football jerseys. Use filters to find your favourite club.
        </p>

        {/* SEARCH + SORT */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-black placeholder-black">

          {/* search */}
          <form action="/shop" className="flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search jerseys..."
              className="rounded-xl border px-4 py-2 text-sm"
            />

            {teamFilter && (
              <input type="hidden" name="team" value={teamFilter} />
            )}

            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Search
            </button>
          </form>

          {/* sorting */}
          <div className="flex gap-2">
            <Link
              href={`/shop?sort=newest${teamFilter ? `&team=${teamFilter}` : ""}`}
              className={`rounded-xl border px-3 py-2 text-sm ${
                sort === "newest"
                  ? "bg-slate-900 text-white"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              Newest
            </Link>

            <Link
              href={`/shop?sort=price-low${teamFilter ? `&team=${teamFilter}` : ""}`}
              className={`rounded-xl border px-3 py-2 text-sm ${
                sort === "price-low"
                  ? "bg-slate-900 text-white"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              Price ↑
            </Link>

            <Link
              href={`/shop?sort=price-high${teamFilter ? `&team=${teamFilter}` : ""}`}
              className={`rounded-xl border px-3 py-2 text-sm ${
                sort === "price-high"
                  ? "bg-slate-900 text-white"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              Price ↓
            </Link>
          </div>
        </div>

        {/* TEAM FILTER */}
        <div className="mt-6 flex flex-wrap gap-4">
          {["Arsenal", "Wolves", "Barcelona", "Real Madrid", "Juventus"].map(
            (team) => (
              <Link
                key={team}
                href={`/shop?team=${team}`}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  team === teamFilter
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {team}
              </Link>
            )
          )}

          <Link
            href="/shop"
            className="rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            All Teams
          </Link>
        </div>

        {/* PRODUCTS GRID */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              team={product.team}
              price={product.price}
              description={product.description}
              image={product.image}
              categoryId={product.categoryId}
            />
          ))}
        </div>

        {/* PAGINATION */}
        <div className="mt-10 flex justify-center gap-3">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/shop?page=${p}${
                teamFilter ? `&team=${teamFilter}` : ""
              }${searchQuery ? `&search=${searchQuery}` : ""}${
                sort ? `&sort=${sort}` : ""
              }`}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                p === page
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}