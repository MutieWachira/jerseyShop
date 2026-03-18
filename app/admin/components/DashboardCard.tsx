"use client";

import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  accent?: "slate" | "emerald" | "blue" | "violet";
}

const ACCENT_STYLES = {
  slate:   { icon: "bg-slate-100 text-slate-600",  border: "border-slate-200" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
  blue:    { icon: "bg-blue-50 text-blue-600",      border: "border-blue-100" },
  violet:  { icon: "bg-violet-50 text-violet-600",  border: "border-violet-100" },
};

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  sub,
  accent = "slate",
}: DashboardCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div className={`bg-white rounded-2xl border ${styles.border} shadow-sm p-5 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <div className={`p-2 rounded-xl ${styles.icon}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>}
      </div>
    </div>
  );
}