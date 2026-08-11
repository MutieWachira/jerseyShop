"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EditCategory() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = status === "authenticated" && session?.user?.role === "ADMIN";
  const isLoadingSession = status === "loading";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        const res = await fetch(`/api/admin/categories`, { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load category.");

        const data = await res.json();
        const cat = data.find((c: any) => c.id === id);
        if (cat) {
          setName(cat.name);
        } else {
          setError("Category not found.");
        }
      } catch (err) {
        setError("Unable to load category.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id, isAdmin]);

  const updateCategory = async () => {
    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "Unable to update category. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/admin/categories");
  };

  if (isLoadingSession) {
    return (
      <div className="text-slate-900 p-6 lg:ml-64 bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm animate-pulse">
          <div className="h-12 w-1/2 rounded-full bg-slate-200" />
          <div className="mt-6 h-56 rounded-[1.75rem] bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-slate-900 p-6 lg:ml-64 bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-rose-200 bg-rose-50 p-10 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-rose-700">Access denied</p>
          <h1 className="mt-4 text-4xl font-black text-rose-900">Admin access required</h1>
          <p className="mt-4 text-sm leading-6 text-rose-800">
            You must sign in with an administrator account to edit categories.
          </p>
          <button
            onClick={() => router.push(`/login?callbackUrl=/admin/categories/${id}`)}
            className="mt-8 inline-flex rounded-3xl bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-900 p-6 lg:ml-64 bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200/50">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Category editor</p>
          <h1 className="text-4xl font-black text-slate-950">Edit category</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Update the category name and slug to keep your catalog organized.
          </p>
        </div>

        <div className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-14 rounded-[1.5rem] bg-slate-100 animate-pulse" />
              <div className="h-28 rounded-[1.5rem] bg-slate-100 animate-pulse" />
            </div>
          ) : (
            <>
              <label className="block text-sm font-semibold text-slate-700">
                Category name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jerseys"
                  className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <div className="mt-4 rounded-3xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                <span className="font-semibold text-slate-900">Slug preview:</span>{" "}
                {name.trim().length > 0 ? name.trim().toLowerCase().replace(/\s+/g, "-") : "Category slug will appear here"}
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={updateCategory}
              disabled={saving || loading}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update category"}
            </button>
            <button
              onClick={() => router.push("/admin/categories")}
              className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
