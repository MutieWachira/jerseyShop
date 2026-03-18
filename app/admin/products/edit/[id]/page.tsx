"use client";

import { useState, useEffect } from "react";
import { Package, ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  size: string;
  version: string;
  stock: number;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [team, setTeam] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch categories
  useEffect(() => {
    const getCategories = async () => {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
    };
    getCategories();
  }, []);

  // Fetch product — now includes variants with size, version, stock
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        const data = await res.json();

        setName(data.name || "");
        setDescription(data.description || "");
        setPrice(data.price?.toString() || "");
        setTeam(data.team || "");
        setCategoryId(data.categoryId || "");
        setImage(data.image || "");

        // Map DB variants to component shape — guards against missing fields
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          setVariants(
            data.variants.map((v: { size: string; version: string; stock: number }) => ({
              size: v.size,
              version: v.version || "FAN",
              stock: v.stock ?? 0,
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    if (id) loadProduct();
  }, [id]);

  // Toggle size on/off
  const toggleSize = (size: string) => {
    const exists = variants.find((v) => v.size === size);
    if (exists) {
      setVariants((prev) => prev.filter((v) => v.size !== size));
    } else {
      setVariants((prev) => [...prev, { size, version: "FAN", stock: 0 }]);
    }
  };

  // Update stock for a size
  const updateStock = (size: string, value: number) => {
    setVariants((prev) =>
      prev.map((v) => (v.size === size ? { ...v, stock: value } : v))
    );
  };

  // Update version for a size
  const updateVersion = (size: string, version: string) => {
    setVariants((prev) =>
      prev.map((v) => (v.size === size ? { ...v, version } : v))
    );
  };

  // Submit update
  const updateProduct = async () => {
    if (!name || !price || !categoryId || !description) {
      return alert("Please fill required fields");
    }

    setLoading(true);

    try {
      let imagePath = image;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const upload = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await upload.json();
        imagePath = uploadData.path;
      }

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          team,
          categoryId,
          image: imagePath,
          variants,
        }),
      });

      if (response.ok) {
        alert("Product Updated Successfully");
        router.push("/admin/products");
      } else {
        const err = await response.json();
        alert(err.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 lg:ml-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8">
      <div className="max-w-4xl mx-auto mb-8">
        <Link
          href="/admin/products"
          className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-2"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Products
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Package className="text-slate-400" /> Edit Product
        </h1>
      </div>

      <div className="text-slate-800 max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* LEFT SIDE */}
          <div className="space-y-4">

            <div>
              <label className="text-sm font-bold">Product Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Team</label>
              <input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="text-sm font-bold">Category</label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 appearance-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="border border-slate-200 rounded-xl p-3 w-full"
              />
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">

            <div>
              <label className="text-sm font-bold mb-2 block">
                Variants (Size, Version, Stock)
              </label>
              <div className="space-y-2">
                {SIZES.map((size) => {
                  const variant = variants.find((v) => v.size === size);
                  return (
                    <div key={size} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`h-10 w-12 rounded-lg font-bold border ${
                          variant
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        {size}
                      </button>

                      {variant && (
                        <>
                          <select
                            value={variant.version}
                            onChange={(e) => updateVersion(size, e.target.value)}
                            className="border rounded-lg p-2"
                          >
                            <option value="FAN">FAN</option>
                            <option value="PLAYER">PLAYER</option>
                          </select>

                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateStock(size, Number(e.target.value))}
                            className="border rounded-lg p-2 w-20"
                            placeholder="Stock"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold mb-2 block">Product Image</label>
              {image && !imageFile && (
                <img src={image} className="rounded-xl mb-3" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>

            <button
              onClick={updateProduct}
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-xl flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}