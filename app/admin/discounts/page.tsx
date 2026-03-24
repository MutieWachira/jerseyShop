"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import {
  Tag,
  Plus,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Discount {
  id:         string;
  code:       string;
  percentage: number;
  maxUses:    number | null;
  usedCount:  number;
  expiresAt:  string | null;
  active:     boolean;
  createdAt:  string;
  _count:     { orders: number };
}

type Feedback = { type: "success" | "error"; message: string } | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (d: Discount) => void;
}) {
  const [code,       setCode]       = useState("");
  const [percentage, setPercentage] = useState("");
  const [maxUses,    setMaxUses]    = useState("");
  const [unlimited,  setUnlimited]  = useState(false);
  const [expiresAt,  setExpiresAt]  = useState("");
  const [noExpiry,   setNoExpiry]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleCreate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/admin/discounts", {
        code,
        percentage,
        maxUses:   unlimited  ? null : maxUses  || null,
        expiresAt: noExpiry   ? null : expiresAt || null,
      });
      onCreated(res.data.discount);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create discount");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">Create Discount Code</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          <Field label="Discount Code" hint="Letters, numbers, hyphens and underscores only">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              maxLength={20}
              className={inputClass}
            />
          </Field>

          <Field label="Percentage Off" hint="Whole number between 1 and 100">
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="e.g. 20"
                className={inputClass + " pr-8"}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">%</span>
            </div>
          </Field>

          <Field label="Max Uses">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unlimited}
                  onChange={(e) => setUnlimited(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-bold text-slate-700">Unlimited uses</span>
              </label>
              {!unlimited && (
                <input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="e.g. 100"
                  className={inputClass}
                />
              )}
            </div>
          </Field>

          <Field label="Expiry Date">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noExpiry}
                  onChange={(e) => setNoExpiry(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-bold text-slate-700">Never expires</span>
              </label>
              {!noExpiry && (
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={inputClass}
                />
              )}
            </div>
          </Field>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3 font-black text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Code"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDiscountsPage() {
  const [discounts,    setDiscounts]    = useState<Discount[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [feedback,     setFeedback]     = useState<Feedback>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [togglingId,   setTogglingId]   = useState<string | null>(null);

  const withAutoClear = (value: Feedback) => {
    setFeedback(value);
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/admin/discounts");
        setDiscounts(res.data);
      } catch {
        withAutoClear({ type: "error", message: "Failed to load discount codes" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await axios.patch(`/api/admin/discounts/${id}`, { active: !current });
      setDiscounts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, active: !current } : d))
      );
    } catch {
      withAutoClear({ type: "error", message: "Failed to update discount" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discount code? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/admin/discounts/${id}`);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
      withAutoClear({ type: "success", message: "Discount code deleted" });
    } catch {
      withAutoClear({ type: "error", message: "Failed to delete discount" });
    } finally {
      setDeletingId(null);
    }
  };

  const isExpired = (expiresAt: string | null) =>
    expiresAt ? new Date() > new Date(expiresAt) : false;

  const getStatus = (d: Discount) => {
    if (!d.active)           return { label: "Inactive",  style: "bg-slate-100 text-slate-500 border-slate-200" };
    if (isExpired(d.expiresAt)) return { label: "Expired",  style: "bg-rose-50 text-rose-600 border-rose-200" };
    if (d.maxUses !== null && d.usedCount >= d.maxUses)
                             return { label: "Used Up",   style: "bg-amber-50 text-amber-600 border-amber-200" };
    return                          { label: "Active",    style: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <AdminSidebar />

      <main className="flex-1 lg:ml-64 p-8 lg:p-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Discounts</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Create and manage discount codes for your shop
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition text-sm"
          >
            <Plus size={16} /> Create Code
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold border mb-6 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            {feedback.type === "success"
              ? <CheckCircle2 size={14} className="shrink-0" />
              : <AlertCircle  size={14} className="shrink-0" />
            }
            {feedback.message}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 animate-pulse">
            <Loader2 className="animate-spin" />
            <span className="font-bold uppercase tracking-widest text-xs">Loading codes...</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Discount</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Uses</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Expires</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {discounts.length > 0 ? discounts.map((d) => {
                    const status = getStatus(d);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">

                        <td className="p-6">
                          <span className="font-black text-slate-900 font-mono tracking-widest text-sm">
                            {d.code}
                          </span>
                        </td>

                        <td className="p-6">
                          <span className="text-sm font-black text-slate-900">
                            {d.percentage}% off
                          </span>
                        </td>

                        <td className="p-6">
                          <div className="text-sm font-bold text-slate-700">
                            {d.usedCount}
                            {d.maxUses !== null ? (
                              <span className="text-slate-400"> / {d.maxUses}</span>
                            ) : (
                              <span className="text-slate-400"> / ∞</span>
                            )}
                          </div>
                          {d.maxUses !== null && (
                            <div className="mt-1 h-1 w-20 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-slate-900 rounded-full"
                                style={{ width: `${Math.min(100, (d.usedCount / d.maxUses) * 100)}%` }}
                              />
                            </div>
                          )}
                        </td>

                        <td className="p-6 text-sm text-slate-500 font-medium">
                          {d.expiresAt
                            ? new Date(d.expiresAt).toLocaleDateString("en-KE", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : <span className="text-slate-400">Never</span>
                          }
                        </td>

                        <td className="p-6">
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${status.style}`}>
                            {status.label}
                          </span>
                        </td>

                        <td className="p-6">
                          <div className="flex justify-end gap-2">

                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggle(d.id, d.active)}
                              disabled={togglingId === d.id}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition disabled:opacity-40"
                              title={d.active ? "Deactivate" : "Activate"}
                            >
                              {togglingId === d.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : d.active ? (
                                <ToggleRight size={18} className="text-emerald-500" />
                              ) : (
                                <ToggleLeft size={18} />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(d.id)}
                              disabled={deletingId === d.id}
                              className="p-2 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition disabled:opacity-40"
                              title="Delete"
                            >
                              {deletingId === d.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Tag size={48} className="text-slate-200" />
                          <p className="text-slate-400 font-bold">No discount codes yet</p>
                          <button
                            onClick={() => setShowModal(true)}
                            className="mt-2 text-xs font-black text-slate-900 underline"
                          >
                            Create your first code
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={(d) => {
            setDiscounts((prev) => [d as any, ...prev]);
            withAutoClear({ type: "success", message: `Code "${d.code}" created successfully` });
          }}
        />
      )}
    </div>
  );
}