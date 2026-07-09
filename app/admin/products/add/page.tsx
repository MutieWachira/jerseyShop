"use client";

import { useState, useEffect } from "react";
import { Package, ArrowLeft, Upload, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";

// Define the shape based on your schema
interface Category {
  id: string;
  name: string;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const VERSIONS = ["FAN", "PLAYER"];

export default function NewProduct() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [team, setTeam] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stock, setStock] = useState("0");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [version, setVersion] = useState("FAN");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch categories from the database on mount
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    getCategories();
  }, []);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const createProduct = async () => {
    // Added description to validation since your API marks it as required
    if (!name || !price || !categoryId || !description || !imageFile) {
      return alert("Please fill in all required fields and upload an image");
    }

    setLoading(true);
    try {
      let imagePath = "";

      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadRequest = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRequest.json();
      if (!uploadRequest.ok || !uploadData.key) {
        throw new Error(uploadData.error || "Failed to upload image");
      }

      imagePath = uploadData.key;

      // 2. Format Variants for the API logic
      // This transforms your selected sizes into the array Prisma needs
      const variants = selectedSizes.map((sz) => ({
        size: sz,
        version: version, // FAN or PLAYER
        stock: parseInt(stock) || 0,
      }));

      // 3. POST to API
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          team,
          categoryId,
          image: imagePath,
          variants: variants, // Matches your API's "const { variants } = body"
        }),
      });

      if (response.ok) {
        alert("Product Created Successfully");
        window.location.href = "/admin/products";
      } else {
        const errorData = await response.json();
        alert(`Failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Products
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="text-slate-400" /> New Product
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-slate-800">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none transition"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none transition"
                  placeholder="Describe the product details..."
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Team Name *
                </label>
                <input
                  placeholder="e.g. Real Madrid"
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none transition"
                  onChange={(e) => setTeam(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <div className="relative">
                  <select
                    className="w-full border border-slate-200 rounded-xl p-3 appearance-none bg-white focus:ring-2 focus:ring-slate-900 outline-none transition"
                    onChange={(e) => setCategoryId(e.target.value)}
                    value={categoryId}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-4 text-slate-400 pointer-events-none"
                    size={18}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-xl p-3"
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Stock Count
                  </label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-xl p-3"
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Kit Version
                </label>
                <div className="flex gap-2">
                  {VERSIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVersion(v)}
                      className={`flex-1 py-2 rounded-lg font-bold border transition ${version === v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`h-10 w-12 rounded-lg font-bold border transition ${selectedSizes.includes(size) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Product Image
                </label>
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition">
                    <Upload className="text-slate-400 mb-2" size={32} />
                    <p className="text-sm font-bold text-slate-600 truncate max-w-xs">
                      {imageFile ? imageFile.name : "Click to upload"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={createProduct}
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 shadow-lg transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} /> Creating...
                    </>
                  ) : (
                    "Publish Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
