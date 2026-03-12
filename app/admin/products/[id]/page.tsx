"use client";

export default function ProductVariants() {

  return (

    <div>

      <h1 className="text-2xl font-bold mb-6">
        Manage Product Variants
      </h1>

      <table className="w-full bg-white border rounded-lg">

        <thead>

          <tr className="text-left border-b text-sm text-gray-500">

            <th className="p-4">Size</th>
            <th>Version</th>
            <th>Stock</th>
            <th></th>

          </tr>

        </thead>

        <tbody>

          <tr className="border-b">

            <td className="p-4">M</td>
            <td>Fan</td>
            <td>10</td>

            <td>
              <button className="text-blue-600">
                Edit
              </button>
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  );
}