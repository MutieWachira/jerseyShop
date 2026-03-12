"use client";

export default function RecentOrders() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">

      <h2 className="text-lg font-semibold mb-4">
        Recent Orders
      </h2>

      <table className="w-full text-left">

        <thead>
          <tr className="text-slate-500 text-sm">
            <th className="pb-3">Order</th>
            <th className="pb-3">Customer</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Amount</th>
          </tr>
        </thead>

        <tbody>

          <tr className="border-t">
            <td className="py-3">#1001</td>
            <td>John Doe</td>
            <td className="text-green-600">Paid</td>
            <td>Ksh 3500</td>
          </tr>

          <tr className="border-t">
            <td className="py-3">#1002</td>
            <td>Jane Smith</td>
            <td className="text-yellow-600">Pending</td>
            <td>Ksh 2800</td>
          </tr>

        </tbody>

      </table>

    </div>
  );
}