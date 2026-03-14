"use client"

import { useState } from "react"
import { Package, ArrowLeft, Upload, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewProduct() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [team, setTeam] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const createProduct = async () => {
    if (!name || !price) return alert("Please fill in required fields");
    
    setLoading(true)
    try {
      let imagePath = ""

      // upload image first
      if (imageFile) {
        const formData = new FormData()
        formData.append("file", imageFile)

        const upload = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })

        const data = await upload.json()
        imagePath = data.path
      }

      // create product
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          team,
          categoryId,
          image: imagePath
        })
      })

      if (response.ok) {
        alert("Product Created Successfully")
        window.location.href = "/admin/products"
      } else {
        alert("Failed to create product")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    // ml-64 matches the sidebar width to prevent overlap
    <div className="min-h-screen bg-slate-50 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8">
      
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <Link 
            href="/admin/products" 
            className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Products
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="text-slate-400" /> New Product
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    placeholder="e.g. Manchester United Home Jersey"
                    className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    placeholder="Describe the material, fit, etc."
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Price ($) *</label>
                    <input
                      type="number"
                      placeholder="89.99"
                      className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Team</label>
                    <input
                      placeholder="e.g. Arsenal"
                      className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                      onChange={(e) => setTeam(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Category & Image */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category ID</label>
                  <input
                    placeholder="e.g. fan-wear"
                    className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                    onChange={(e) => setCategoryId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Product Image</label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition">
                      <Upload className="text-slate-400 mb-2" size={32} />
                      <p className="text-sm font-bold text-slate-600">
                        {imageFile ? imageFile.name : "Click to upload image"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={createProduct}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin" size={20} /> Creating...</>
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
    </div>
  )
}
