"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import { Edit3, Trash2, PackageSearch, Loader2 } from "lucide-react";

function ProductImageCell({ image, alt }: { image?: string | null; alt: string }) {
  const [src, setSrc] = useState(image || "/placeholder-jersey.png");

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      if (!image || image.startsWith("http") || image.startsWith("/")) {
        if (isMounted) setSrc(image || "/placeholder-jersey.png");
        return;
      }

      try {
        const res = await fetch(`/api/images?key=${encodeURIComponent(image)}`);
        const data = await res.json();
        if (isMounted) setSrc(data.url || "/placeholder-jersey.png");
      } catch {
        if (isMounted) setSrc("/placeholder-jersey.png");
      }
    };

    resolveImage();
    return () => {
      isMounted = false;
    };
  }, [image]);

  return (
    <img
      src={src}
      alt={alt}
      className="h-14 w-14 object-cover rounded-2xl border border-slate-100 bg-white"
    />
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get("/api/admin/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("API Error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;

    setDeletingId(id);

    try {
      await axios.delete(`/api/admin/products/${id}`);
      // Remove deleted product from state without re-fetching
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <AdminSidebar />

      <main className="flex-1 lg:ml-64 p-8 lg:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage your shop products and stock levels.</p>
          </div>
          <Link
            href="/admin/products/add"
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-95 text-sm"
          >
            + Add New Jersey
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 animate-pulse">
            <PackageSearch />
            <span className="font-bold uppercase tracking-widest text-xs">Loading inventory...</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Team</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stock</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.length > 0 ? (
                    products.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <ProductImageCell image={p.image} alt={p.name} />
                            <span className="text-sm font-bold text-slate-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="p-6 text-sm font-bold text-slate-500">{p.team}</td>
                        <td className="p-6">
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                            {p.category?.name || "General"}
                          </span>
                        </td>
                        <td className="p-6 text-sm font-black text-slate-900">Ksh {p.price.toLocaleString()}</td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                            (p.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0) > 0
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}>
                            {p.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/products/edit/${p.id}`}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                              title="Edit Product"
                            >
                              <Edit3 size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                              className="p-2 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition disabled:opacity-50"
                              title="Delete Product"
                            >
                              {deletingId === p.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <PackageSearch size={48} className="text-slate-200" />
                          <p className="text-slate-400 font-bold">No products found in your inventory.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}