import Link from "next/link";
import { getFeaturedProducts } from "@/src/lib/products";
import ProductCard from "@/src/components/ProductCard";

// 1. Define the shape of your product data for TypeScript
interface Product {
  id: number;
  name: string;
  team: string;
  price: number;
  description?: string | null;
}

export default async function HomePage() {
  // TypeScript will now know that featuredProducts is an array of Products
  const featuredProducts: Product[] = await getFeaturedProducts();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">Premium Football Jersey</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Wear your club
              <span className="block text-slate-500">Own your style</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Discover authentic-looking football jerseys, fan favourites and limited-edition drops from the biggest clubs 
              in the world. Built for supporters who want style, comfort and identity
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/shop" className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800">Shop Now</Link>
              <Link href="/categories" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50">Browse Categories</Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-extrabold text-slate-900">100+</p>
                <p className="mt-1 text-sm text-slate-600">Jersey Styles</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-extrabold text-slate-900">Top</p>
                <p className="mt-1 text-sm text-slate-600">European clubs</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-extrabold text-slate-900">Fast</p>
                <p className="mt-1 text-sm text-slate-600">Order process</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Featured Drop</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight">2026 Elite Club Collection</h2>
                <p className="mt-4 text-sm leading-7 text-slate-200"> New season jerseys inspired by the world's most iconic clubs. Sleek fit, stylish detail and premium feel</p>
                <div className="mt-8 rounded-3xl bg-white/10 p-6 backdrop-blur">
                  <div className="flex h-56 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-lg font-extrabold text-slate-200">HERO PRODUCT IMAGE</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-md sm:block">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trending Now</p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">Arsenal . Barcelona . Real Madrid</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">Featured Products</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Fan favourite this week</h2>
          </div>
          <Link href="/shop" className="text-sm font-extrabold text-slate-700 transition hover:text-slate-900"> View all products</Link>
        </div>
        <div className="mt-8 grid grid-cols gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 2. Explicitly type 'product' here to resolve the build error */}
          {featuredProducts.map((product: Product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              team={product.team}
              price={product.price}
              description={product.description ?? undefined}
            />
          ))}
          {featuredProducts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">No featured products yet</div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-900 px-6 py-10 text-white shadow-sm sm:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-400">Start Shopping</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Find the jersey that matches your passion
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">Explore club collections, compare styles and build a modern football wardrobe from one clean shopping experience</p>
            <div className="mt-6">
              <Link href="/shop" className="inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-100">Explore Shop</Link>
            </div>   
          </div>
        </div>
      </section>
    </main>
  );
}
