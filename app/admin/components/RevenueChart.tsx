"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useState } from "react";

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: MonthlyData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-3 text-sm">
        <p className="font-black text-slate-900 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="font-bold" style={{ color: entry.color }}>
            {entry.name === "revenue"
              ? `Ksh ${Number(entry.value).toLocaleString()}`
              : `${entry.value} orders`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data }: RevenueChartProps) {
  const [view, setView] = useState<"revenue" | "orders">("revenue");

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-300 font-bold text-sm">
        No data yet
      </div>
    );
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-6">
        {(["revenue", "orders"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              view === v
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        {view === "revenue" ? (
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0f172a" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0f172a"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={{ fill: "#0f172a", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#0f172a" }}
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" fill="#0f172a" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}