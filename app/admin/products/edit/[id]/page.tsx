"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function EditProduct() {
  const { id } = useParams()
  const router = useRouter()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [team, setTeam] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [image, setImage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    // Note: Removed "/get" from the end of the URL to match standard route [id]
    fetch(`/api/admin/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setName(data.name || "")
          setDescription(data.description || "")
          setPrice(data.price?.toString() || "")
          setTeam(data.team || "")
          setCategoryId(data.categoryId || "")
          setImage(data.image || "")
        }
      })
      .catch(err => console.error("Error loading product:", err))
      .finally(() => setFetching(false))
  }, [id])

  const updateProduct = async () => {
    if (!name || !price) return alert("Name and Price are required")
    
    setLoading(true)
    let imagePath = image

    try {
      // 1. Handle optional image upload
      if (imageFile) {
        const formData = new FormData()
        formData.append("file", imageFile)

        const upload = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })
        const data = await upload.json()
        imagePath = data.path // Ensure this matches your upload API return key
      }

      // 2. Send PUT request
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price), // CRITICAL: Convert string to Number
          team,
          categoryId,
          image: imagePath
        })
      })

      if (response.ok) {
        alert("Product Updated Successfully")
        router.push("/admin/products")
        router.refresh() // Force the table to show new data
      } else {
        const errData = await response.json()
        alert(`Error: ${errData.error || "Update failed"}`)
      }
    } catch (err) {
      console.error(err)
      alert("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-10 text-center">Loading product data...</div>

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:underline">Cancel</button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Product Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 text-slate-700 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none transition"
              placeholder="Jersey Name"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 text-slate-700 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none transition"
              placeholder="Product details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price (Ksh)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 text-slate-700 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Team</label>
              <input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="mt-1 text-slate-700 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none transition"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Product Image</p>
            <div className="flex items-center gap-4">
              <img src={image} alt="Preview" className="w-20 h-20 object-cover rounded-lg border bg-white" />
              <div className="flex-1">
                <input
                  type="file"
                  className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-700"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <p className="text-[10px] text-slate-400 mt-2 italic">Leave empty to keep current image</p>
              </div>
            </div>
          </div>

          <button
            onClick={updateProduct}
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
          >
            {loading ? "Saving Changes..." : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  )
}
