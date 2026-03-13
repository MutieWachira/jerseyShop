"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);  // Updated to allow any[] assignment
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await axios.get("/api/admin/products");
        console.log("API Response:", res.data);  // Add this
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("API Error:", err);  // Add this
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Link 
          href="/admin/products/add" 
          className="bg-slate-900 text-white px-5 py-2 rounded-xl font-medium hover:bg-slate-800 transition"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading your inventory...</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-700">Image</th>
                <th className="p-4 font-semibold text-slate-700">Product Name</th>
                <th className="p-4 font-semibold text-slate-700">Team</th>
                <th className="p-4 font-semibold text-slate-700">Category</th>
                <th className="p-4 font-semibold text-slate-700">Price</th>
                <th className="p-4 font-semibold text-slate-700 text-center">Stock</th>
                <th className="p-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length > 0 ? (
                products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <img src={p.image || "/placeholder-jersey.png"} alt={p.name} className="h-16 w-16 object-cover rounded" />
                    </td>
                    <td className="p-4 text-slate-900 font-medium">{p.name}</td>
                    <td className="p-4 text-slate-600">{p.team}</td>
                    <td className="p-4 text-slate-600">{p.category?.name}</td>
                    <td className="p-4 text-slate-600">Kshs{p.price.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-700">
                        {p.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0}
                      </span>
                    </td>
                    <td className="p-4 gap-3 flex">
                      <Link 
                        href={`/admin/products/edit/${p.id}`} 
                        className="text-blue-500 hover:text-blue-700 "
                      >
                        Edit
                      </Link>
                      <Link 
                        href={`/admin/products/delete/${p.id}`} 
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No products found. Try adding your first jersey!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
