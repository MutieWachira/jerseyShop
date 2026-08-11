"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const isSessionLoading = status === "loading";
  const isUnauthorized = status === "unauthenticated" || (status === "authenticated" && !isAdmin);

  const loadCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/categories", { cache: "no-store" });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Unable to load categories (${res.status}).`;

      if (text) {
        try {
          const json = JSON.parse(text);
          if (json?.error) {
            errorMessage = json.error;
          }
        } catch {
          errorMessage = text;
        }
      }

      setCategories([]);
      setFeedback(errorMessage);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      loadCategories();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, isAdmin]);

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setFeedback("Unable to delete category. Please try again.");
      return;
    }

    setFeedback("Category deleted successfully.");
    setCategories((current) => current.filter((cat) => cat.id !== id));
  };

  const filteredCategories = categories.filter((category) => {
    const term = search.toLowerCase();
    return (
      category.name.toLowerCase().includes(term) ||
      category.slug.toLowerCase().includes(term)
    );
  });

  if (isSessionLoading) {
    return (
      <div className="text-slate-900 p-6 lg:ml-64">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm animate-pulse">
          <div className="h-8 w-1/3 bg-slate-200 rounded-full" />
          <div className="mt-6 h-64 rounded-[1.75rem] bg-slate-200" />
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="text-slate-900 p-6 lg:ml-64">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-rose-700">Access denied</p>
          <h1 className="mt-4 text-3xl font-black text-rose-900">Admin access required</h1>
          <p className="mt-3 text-sm text-rose-800">You must be signed in as an administrator to view or manage categories.</p>
          <Link
            href="/login?callbackUrl=/admin/categories"
            className="mt-8 inline-flex rounded-3xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Sign in as admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-900 p-6 lg:ml-64 bg-slate-50 min-h-screen">
      <div className="mb-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-8 py-10 text-white shadow-2xl shadow-slate-500/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Categories administration</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Manage your product categories</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Keep your store organized with clean category management. Add new groups, edit existing ones, and keep the catalog aligned with your inventory.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/categories/new"
              className="inline-flex items-center justify-center rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              + New category
            </Link>
          </div>
        </div>
      </div>

      {feedback ? (
        <div className="mb-6 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-800 shadow-sm">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3 mb-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Total categories</p>
          <p className="mt-4 text-3xl font-black text-slate-900">{categories.length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Search results</p>
          <p className="mt-4 text-3xl font-black text-slate-900">{filteredCategories.length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Latest feedback</p>
          <p className="mt-4 text-lg font-semibold text-slate-900">{feedback ?? "Ready for updates."}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Category inventory</h2>
            <p className="text-sm text-slate-500">Search, edit, or remove categories with confidence.</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-28 rounded-[1.75rem] bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
            {categories.length === 0 ? (
              <>
                <p className="font-semibold text-slate-900">No categories yet</p>
                <p className="mt-2">Add your first category to get started.</p>
              </>
            ) : (
              <p>No categories match your search. Try a different term or add a new category.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="group flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 transition hover:border-slate-300 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">{category.name}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Slug: <span className="font-medium text-slate-700">{category.slug}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
