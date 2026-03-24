"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCategory() {
  const { id } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");

  useEffect(() => {
    fetch(`/api/admin/categories`)
      .then(res => res.json())
      .then(data => {
        const cat = data.find((c: any) => c.id === id);
        if (cat) setName(cat.name);
      });
  }, [id]);

  const updateCategory = async () => {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    router.push("/admin/categories");
  };

  return (
    <div className="text-slate-800 p-8 lg:ml-64">
      <h1 className="text-xl font-bold mb-4">Edit Category</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-3 rounded-xl w-full mb-4"
      />

      <button
        onClick={updateCategory}
        className="bg-slate-900 text-white px-4 py-2 rounded-xl"
      >
        Update
      </button>
    </div>
  );
}