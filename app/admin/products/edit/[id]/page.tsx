"use client";

import { useState, useEffect } from "react";
import { Package, ArrowLeft, Loader2, ChevronDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { normalizeProductImage, resolveProductImageUrl, shouldRequestSignedImageUrl } from "@/src/lib/image";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  size: string;
  version: string;
  stock: string;
  enabled: boolean;
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
  const [imageUrl, setImageUrl] = useState<string>("/placeholder-jersey.png");

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
        const resolvedImage = data.image || "";
        setImage(resolvedImage);
        setImageUrl(normalizeProductImage(resolvedImage) || "/placeholder-jersey.png");

        if (shouldRequestSignedImageUrl(resolvedImage)) {
          const signedUrl = await resolveProductImageUrl(resolvedImage);
          setImageUrl(signedUrl);
        }

        if (Array.isArray(data.variants) && data.variants.length > 0) {
          const productVariants = data.variants as { size: string; version: string; stock: number }[];
          const loadedSizes = Array.from(new Set(productVariants.map((v) => v.size)));

          setVariants(
            loadedSizes.flatMap((size) => {
              const fan = productVariants.find((v) => v.size === size && v.version === "FAN");
              const player = productVariants.find((v) => v.size === size && v.version === "PLAYER");

              return [
                {
                  size,
                  version: "FAN",
                  stock: String(fan?.stock ?? 0),
                  enabled: Boolean(fan),
                },
                {
                  size,
                  version: "PLAYER",
                  stock: String(player?.stock ?? 0),
                  enabled: Boolean(player),
                },
              ];
            }),
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

  // Toggle size on/off in the UI
  const toggleSize = (size: string) => {
    setVariants((prev) => {
      const exists = prev.some((v) => v.size === size);
      if (exists) {
        return prev.filter((v) => v.size !== size);
      }

      return [
        ...prev,
        { size, version: "FAN", stock: "0", enabled: true },
        { size, version: "PLAYER", stock: "0", enabled: false },
      ];
    });
  };

  const updateVariant = (
    size: string,
    version: string,
    field: "stock" | "enabled",
    value: string | boolean,
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.size === size && variant.version === version
          ? { ...variant, [field]: value }
          : variant,
      ),
    );
  };

  // Submit update
  const updateProduct = async () => {
    if (!name || !price || !categoryId || !description || !variants.some((variant) => variant.enabled)) {
      return alert("Please fill required fields and enable at least one variant.");
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

      const enabledVariants = variants
        .filter((variant) => variant.enabled)
        .map((variant) => ({
          size: variant.size,
          version: variant.version,
          stock: Number(variant.stock) || 0,
        }));

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
          variants: enabledVariants,
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
              <div className="space-y-4">
                {SIZES.map((size) => {
                  const sizeVariants = variants.filter((v) => v.size === size);
                  const selected = sizeVariants.length > 0;

                  return (
                    <div key={size} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`h-10 w-12 rounded-lg font-bold border ${
                              selected
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            {size}
                          </button>
                          <span className="text-sm font-semibold text-slate-700">{size}</span>
                        </div>
                        {selected ? (
                          <button
                            type="button"
                            onClick={() => toggleSize(size)}
                            className="text-rose-600 hover:text-rose-800 text-sm"
                          >
                            Remove size
                          </button>
                        ) : null}
                      </div>

                      {selected ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {sizeVariants.map((variant, index) => (
                            <div
                              key={`${variant.size}-${variant.version}`}
                              className="rounded-3xl border border-slate-200 bg-white p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-slate-900">{variant.version}</span>
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={variant.enabled}
                                    onChange={(e) => updateVariant(variant.size, variant.version, "enabled", e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                  />
                                  Enabled
                                </label>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Stock</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(variant.size, variant.version, "stock", e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold mb-2 block">Product Image</label>
              {imageUrl && !imageFile && (
                <img src={imageUrl} className="rounded-xl mb-3" />
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