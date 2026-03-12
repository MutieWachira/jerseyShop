"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 5000 },
];

export default function SalesChart() {

  return (

    <div className="bg-white border rounded-xl p-6">

      <h2 className="text-lg font-semibold mb-4">
        Monthly Sales
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <LineChart data={data}>

          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="sales"
            stroke="#000"
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );
}