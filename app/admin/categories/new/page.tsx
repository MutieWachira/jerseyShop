"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCategory() {
  const [name, setName] = useState("");
  const router = useRouter();

  const createCategory = async () => {
    if (!name) return alert("Enter category name");

    await fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    router.push("/admin/categories");
  };

  return (
    <div className="text-slate-800 p-8 lg:ml-64">
      <h1 className="text-xl font-bold mb-4">New Category</h1>

      <input
        placeholder="Category name"
        onChange={(e) => setName(e.target.value)}
        className="border p-3 rounded-xl w-full mb-4"
      />

      <button
        onClick={createCategory}
        className="bg-slate-900 text-white px-4 py-2 rounded-xl"
      >
        Create
      </button>
    </div>
  );
}