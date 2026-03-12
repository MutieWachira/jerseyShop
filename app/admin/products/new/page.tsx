"use client";

import Link from "next/link";

export default function AdminProducts() {

  return (

    <div>

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-2xl font-bold">
          Products
        </h1>

        <Link
          href="/admin/products/new"
          className="bg-black text-white px-5 py-2 rounded-lg"
        >
          Add Product
        </Link>

      </div>

      <table className="w-full bg-white border border-slate-200 rounded-xl">

        <thead>

          <tr className="text-left text-slate-500 text-sm border-b">

            <th className="p-4">Product</th>
            <th>Team</th>
            <th>Price</th>
            <th></th>

          </tr>

        </thead>

        <tbody>

          <tr className="border-b">

            <td className="p-4">
              Arsenal Home Jersey
            </td>

            <td>Arsenal</td>

            <td>Ksh 3500</td>

            <td>
              <Link
                href="/admin/products/1"
                className="text-blue-600"
              >
                Edit
              </Link>
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  );
}