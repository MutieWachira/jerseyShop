"use client";

export default function AdminOrders() {

  return (

    <div>

      <h1 className="text-2xl font-bold mb-6">
        Orders
      </h1>

      <table className="w-full bg-white border rounded-lg">

        <thead>

          <tr className="text-left border-b text-gray-500 text-sm">

            <th className="p-4">Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>

          </tr>

        </thead>

        <tbody>

          <tr className="border-b">

            <td className="p-4">#1001</td>
            <td>Christopher</td>

            <td>

              <select className="border p-2 rounded">

                <option>PENDING</option>
                <option>PAID</option>
                <option>SHIPPED</option>
                <option>DELIVERED</option>

              </select>

            </td>

            <td>Ksh 3500</td>

          </tr>

        </tbody>

      </table>

    </div>

  );
}