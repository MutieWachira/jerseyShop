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
  const [variants, setVariants] = useState<{
    size: string;
    version: string;
    stock: string;
    enabled: boolean;
  }[]>([]);
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
    setVariants((prev) => {
      const existingVariants = prev.filter((variant) => variant.size === size);
      if (existingVariants.length > 0) {
        return prev.filter((variant) => variant.size !== size);
      }

      return [
        ...prev,
        { size, version: "FAN", stock: "0", enabled: true },
        { size, version: "PLAYER", stock: "0", enabled: false },
      ];
    });
  };

  const updateVariant = (
    index: number,
    field: "stock" | "enabled",
    value: string | boolean,
  ) => {
    setVariants((prev) =>
      prev.map((variant, idx) =>
        idx === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const createProduct = async () => {
    // Added description to validation since your API marks it as required
    if (!name || !price || !categoryId || !description || !imageFile || !variants.some((variant) => variant.enabled)) {
      return alert("Please fill in all required fields, enable at least one variant, and upload an image.");
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
      // Only send enabled size/version combinations
      const formattedVariants = variants
        .filter((variant) => variant.enabled)
        .map((variant) => ({
          size: variant.size,
          version: variant.version,
          stock: parseInt(variant.stock) || 0,
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
          variants: formattedVariants,
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
                    Team Size Variants
                  </label>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Select one or more sizes below, then set the stock and kit version for each.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => {
                    const selected = variants.some((variant) => variant.size === size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`h-10 w-12 rounded-lg font-bold border transition ${selected ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {variants.length > 0 ? (
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Variant details</p>
                  {Array.from(new Set(variants.map((variant) => variant.size))).map((size) => (
                    <div key={size} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between rounded-3xl bg-slate-100 p-3 text-sm font-semibold text-slate-900">
                        <span>{size}</span>
                        <button
                          type="button"
                          onClick={() => toggleSize(size)}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          Remove size
                        </button>
                      </div>

                      <div className="grid gap-3">
                        {variants.map((variant, index) =>
                          variant.size === size ? (
                            <div
                              key={`${variant.size}-${variant.version}`}
                              className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[140px_1fr]"
                            >
                              <div className="flex flex-col justify-between rounded-3xl bg-white p-3 text-sm font-semibold text-slate-900">
                                <span>{variant.version}</span>
                                <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={variant.enabled}
                                    onChange={(e) => updateVariant(index, "enabled", e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                  />
                                  Enabled
                                </label>
                              </div>

                              <div className="grid gap-3">
                                <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Stock</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={variant.stock}
                                    onChange={(e) => updateVariant(index, "stock", e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

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
