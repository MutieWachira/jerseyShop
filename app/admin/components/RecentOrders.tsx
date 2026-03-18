"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface RecentOrder {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  user: { name: string | null; email: string | null };
  _count: { items: number };
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   "bg-amber-50   text-amber-600   border-amber-200",
  PAID:      "bg-blue-50    text-blue-600    border-blue-200",
  SHIPPED:   "bg-violet-50  text-violet-600  border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-rose-50    text-rose-600    border-rose-200",
};

export default function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <ShoppingBag size={36} className="text-slate-200" />
        <p className="text-slate-400 font-bold text-sm">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Order</th>
            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell">Items</th>
            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/50 transition">
              <td className="py-3.5 pr-4">
                <span className="text-sm font-black text-slate-900 font-mono">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
              </td>
              <td className="py-3.5 pr-4">
                <p className="text-sm font-bold text-slate-800">{order.user.name || "—"}</p>
                <p className="text-[10px] text-slate-400">{order.user.email}</p>
              </td>
              <td className="py-3.5 pr-4 hidden sm:table-cell">
                <span className="text-sm text-slate-500 font-medium">
                  {order._count.items} item{order._count.items !== 1 ? "s" : ""}
                </span>
              </td>
              <td className="py-3.5 pr-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td className="py-3.5 text-right">
                <span className="text-sm font-black text-slate-900">
                  Ksh {order.total.toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}