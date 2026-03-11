import Link from "next/link";

const categories = [
  {
    name: "Premier League",
    slug: "premier-league",
    description: "Official jerseys from Premier League clubs",
  },
  {
    name: "La Liga",
    slug: "la-liga",
    description: "Spanish league football jerseys",
  },
  {
    name: "Serie A",
    slug: "serie-a",
    description: "Italian football club jerseys",
  },
  {
    name: "International",
    slug: "international",
    description: "National team jerseys",
  },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">

        <h1 className="text-3xl font-bold text-slate-900 mb-10">
          Jersey Categories
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="rounded-2xl border border-slate-200 p-6 hover:shadow-md transition"
            >

              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {category.name}
              </h2>

              <p className="text-sm text-slate-600">
                {category.description}
              </p>

            </Link>
          ))}

        </div>

      </div>
    </main>
  );
}