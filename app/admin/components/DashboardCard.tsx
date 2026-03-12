"use client";

interface DashboardCardProps {
  title: string;
  value: string | number;
}

export default function DashboardCard({ title, value }: DashboardCardProps) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">

      <h3 className="text-sm text-slate-500">
        {title}
      </h3>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>

    </div>
  );
}