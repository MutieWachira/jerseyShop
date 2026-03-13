"use client"

import { useState } from "react"

export default function NewProduct(){

  const [name,setName] = useState("")
  const [description,setDescription] = useState("")
  const [price,setPrice] = useState("")
  const [team,setTeam] = useState("")
  const [categoryId,setCategoryId] = useState("")
  const [imageFile,setImageFile] = useState<File | null>(null)
  const [loading,setLoading] = useState(false)

  const createProduct = async () => {

    setLoading(true)

    let imagePath = ""

    // upload image first
    if(imageFile){

      const formData = new FormData()
      formData.append("file", imageFile)

      const upload = await fetch("/api/upload",{
        method:"POST",
        body:formData
      })

      const data = await upload.json()
      imagePath = data.path
    }

    // create product
    await fetch("/api/admin/products",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        name,
        description,
        price,
        team,
        categoryId,
        image:imagePath
      })
    })

    setLoading(false)

    alert("Product Created")

    window.location.href="/admin/products"
  }

  return(

    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-xl">

        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Create New Product
        </h1>

        <div className="space-y-4">

          <input
            placeholder="Product Name"
            className="text-slate-700 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onChange={(e)=>setName(e.target.value)}
          />

          <textarea
            placeholder="Description"
            className="text-slate-700 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onChange={(e)=>setDescription(e.target.value)}
          />

          <input
            type="number"
            placeholder="Price"
            className="text-slate-700 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onChange={(e)=>setPrice(e.target.value)}
          />

          <input
            placeholder="Team"
            className="text-slate-700 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onChange={(e)=>setTeam(e.target.value)}
          />

          <input
            placeholder="Category ID"
            className="text-slate-700 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onChange={(e)=>setCategoryId(e.target.value)}
          />

          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            className="text-slate-700 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
            onChange={(e)=>setImageFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={createProduct}
            disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>

        </div>

      </div>

    </div>

  )
}