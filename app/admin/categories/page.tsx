"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category?")) return;

    await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });

    loadCategories();
  };

  return (
    <div className="text-slate-800 p-8 lg:ml-64">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link href="/admin/categories/new" className="bg-slate-900 text-white px-4 py-2 rounded-xl">
          + New Category
        </Link>
      </div>

      <div className="bg-white rounded-xl border">
        {categories.map((cat: any) => (
          <div key={cat.id} className="flex justify-between p-4 border-b">
            <div>
              <p className="font-bold">{cat.name}</p>
              <p className="text-xs text-slate-500">{cat.slug}</p>
            </div>

            <div className="flex gap-2">
              <Link href={`/admin/categories/${cat.id}`} className="text-blue-600">
                Edit
              </Link>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}