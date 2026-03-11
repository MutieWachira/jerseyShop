export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16">

        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          About JerseyShop
        </h1>

        <p className="text-slate-600 mb-6 leading-relaxed">
          JerseyShop is an online platform dedicated to providing football
          fans with high quality club and national team jerseys from
          leagues across the world. Our goal is to make it easy for fans
          to find their favorite team jerseys in both fan and player
          versions with multiple size options.
        </p>

        <p className="text-slate-600 mb-6 leading-relaxed">
          Whether you support clubs from the Premier League, La Liga,
          Serie A, or international teams, JerseyShop provides a simple
          and secure way to browse, select, and purchase jerseys online.
        </p>

        <p className="text-slate-600 leading-relaxed">
          This platform was built as a modern web application using
          technologies such as Next.js, Prisma, and PostgreSQL to
          deliver a fast and reliable shopping experience.
        </p>

      </div>
    </main>
  );
}