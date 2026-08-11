"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import { normalizeMpesaPhone } from "@/src/lib/mpesa";
import {
  DollarSign,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Shield,
  ArrowUpRight,
  Plus,
  Lock,
} from "lucide-react";

interface WithdrawalRecord {
  id: string;
  amount: number;
  phone: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  reference: string;
  transactionId: string | null;
  createdAt: string;
  admin: { name: string | null };
}

interface FinanceOverview {
  totalRevenue: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableBalance: number;
  recentWithdrawals: WithdrawalRecord[];
  recentPayments?: Array<{
    id: string;
    paymentReference: string;
    amount: number;
    status: string;
    provider: string;
    createdAt: string;
    order?: { orderNumber?: string } | null;
  }>;
}

const MIN_WITHDRAWAL_AMOUNT = 1;

function summaryClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/finance");
      setOverview(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.response?.data?.error || "Unable to load finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const amount = Number(withdrawAmount);
    if (Number.isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) {
      setErrorMessage(`Enter a valid withdrawal amount (min Ksh ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()})`);
      return;
    }

    if (!withdrawPhone.trim()) {
      setErrorMessage("Enter the target M-Pesa phone number");
      return;
    }

    const normalizedPhone = normalizeMpesaPhone(withdrawPhone);
    if (!/^2547\d{8}$/.test(normalizedPhone)) {
      setErrorMessage("Enter a valid M-Pesa phone number in the format 07XXXXXXXX or +2547XXXXXXXX");
      return;
    }

    if (!withdrawPassword.trim()) {
      setErrorMessage("Enter your admin password to authorize the transfer");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/admin/finance", {
        amount,
        phone: normalizedPhone,
        password: withdrawPassword,
      });
      if (res.data?.success) {
        setSuccessMessage("Withdrawal requested successfully. Check recent activity below.");
        setWithdrawAmount("");
        setWithdrawPhone("");
        setWithdrawPassword("");
        setModalOpen(false);
        await fetchOverview();
      } else {
        setErrorMessage(res.data?.error || "Unable to complete withdrawal.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.response?.data?.error || "Unable to complete withdrawal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-6 md:p-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400 font-black">Finance</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">Funds & Withdrawals</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-500 leading-6">
                Monitor your shop's available balance, track completed and pending transfers, and securely withdraw funds from the M-Pesa sandbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchOverview}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
              >
                <Plus size={16} /> Withdraw
              </button>
            </div>
          </div>

          {loading || !overview ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin" />
              Loading your finance overview...
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-4">
                {[
                  {
                    label: "Available Balance",
                    value: overview.availableBalance,
                    icon: DollarSign,
                    accent: "bg-emerald-50 text-emerald-700",
                    note: "Ready for withdrawal",
                  },
                  {
                    label: "Total Revenue",
                    value: overview.totalRevenue,
                    icon: ArrowUpRight,
                    accent: "bg-slate-50 text-slate-900",
                    note: "Confirmed paid orders",
                  },
                  {
                    label: "Withdrawn",
                    value: overview.totalWithdrawn,
                    icon: CreditCard,
                    accent: "bg-blue-50 text-blue-700",
                    note: "Completed payouts",
                  },
                  {
                    label: "Pending Transfers",
                    value: overview.pendingWithdrawals,
                    icon: Shield,
                    accent: "bg-amber-50 text-amber-700",
                    note: "Awaiting M-Pesa confirmation",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className={`inline-flex items-center justify-center rounded-3xl px-3 py-3 ${item.accent}`}>
                      <item.icon size={18} />
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                    <p className="mt-3 text-3xl font-black text-slate-900">Ksh {item.value.toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.note}</p>
                  </div>
                ))}
              </div>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Recent Withdrawal Activity</h2>
                    <p className="text-sm text-slate-500">Review transfers from the past 10 requests.</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                    Managed securely with your admin password
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[0.18em] text-[10px]">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Requested By</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview.recentWithdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 font-mono text-slate-800">{withdrawal.reference}</td>
                          <td className="px-4 py-4 font-black text-slate-900">{formatCurrency(withdrawal.amount)}</td>
                          <td className="px-4 py-4 text-slate-600">{withdrawal.phone}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${summaryClass(withdrawal.status)}`}>
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{withdrawal.admin.name || "Admin"}</td>
                          <td className="px-4 py-4 text-slate-500">{new Date(withdrawal.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Recent Payments</h2>
                    <p className="text-sm text-slate-500">Latest payment events (STK pushes, updates).</p>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[0.18em] text-[10px]">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview.recentPayments?.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 font-mono text-slate-800">{p.paymentReference}</td>
                          <td className="px-4 py-4 font-black text-slate-900">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-4 text-slate-600">{p.provider}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${summaryClass(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{p.order?.orderNumber || "-"}</td>
                          <td className="px-4 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {errorMessage && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
              <AlertTriangle size={16} className="inline-block mr-2" />
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={16} className="inline-block mr-2" />
              {successMessage}
            </div>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white border border-slate-200 p-8 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">New Withdrawal</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Transfer funds to M-Pesa</h2>
                  <p className="mt-2 text-sm text-slate-500 max-w-xl">
                    Withdraw money from the current available balance. The transaction is validated with your admin password before starting the M-Pesa sandbox transfer.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-500 hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Amount (KES)</span>
                    <input
                      type="number"
                      min={MIN_WITHDRAWAL_AMOUNT}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="2500"
                      inputMode="numeric"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">M-Pesa Phone</span>
                    <input
                      type="tel"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="0722XXXXXX"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Admin Password</span>
                  <input
                    type="password"
                    value={withdrawPassword}
                    onChange={(e) => setWithdrawPassword(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="••••••••"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Minimum withdrawal is Ksh {MIN_WITHDRAWAL_AMOUNT.toLocaleString()}. Remaining balance will be updated after the request.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
