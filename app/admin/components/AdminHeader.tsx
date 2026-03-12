"use client";

export default function AdminHeader() {
  return (
    <header className="flex justify-between items-center mb-8">

      <h1 className="text-2xl font-bold text-slate-900">
        Admin Panel
      </h1>

      <div className="flex items-center gap-4">

        <input
          placeholder="Search..."
          className="border border-slate-300 px-4 py-2 rounded-lg"
        />

        <div className="w-10 h-10 bg-slate-200 rounded-full"></div>

      </div>

    </header>
  );
}