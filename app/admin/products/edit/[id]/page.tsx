"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Package, ArrowLeft, Upload, Loader2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

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

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
        alert("Product Updated Successfully")
        router.push("/admin/products")
        router.refresh()
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 lg:ml-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={40} />
      </div>
    )
  }

  return (
    // lg:ml-64 accounts for sidebar, pt-24 accounts for mobile top bar
    <div className="min-h-screen bg-slate-50 lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 transition-all">
      
      <div className="max-w-4xl mx-auto mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition mb-2"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Products
        </button>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <Package className="text-slate-400" /> Edit Product
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Side: Text Details */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1 ml-1">Product Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none transition"
                    placeholder="Jersey Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1 ml-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none transition"
                    placeholder="Product details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1 ml-1">Price (Ksh)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1 ml-1">Team</label>
                    <input
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Media & Actions */}
              <div className="space-y-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <ImageIcon size={14} /> Current Image
                  </label>
                  
                  <div className="flex flex-col items-center gap-4">
                    {image ? (
                      <img 
                        src={image} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-xl border border-white shadow-sm bg-white" 
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-300">
                        No Image
                      </div>
                    )}
                    
                    <div className="w-full ">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="product-image"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      />
                      <label 
                        htmlFor="product-image"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition shadow-sm"
                      >
                        <Upload size={16} />
                        {imageFile ? imageFile.name : "Replace Image"}
                      </label>
                      <p className="text-[10px] text-slate-400 mt-2 text-center italic font-medium">
                        Leaving this empty keeps the current image
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={updateProduct}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin" size={20} /> Saving Changes...</>
                    ) : (
                      "Update Product"
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
