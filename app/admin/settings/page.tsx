"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import {
  Store,
  User,
  Package,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface Settings {
  shop_name: string;
  shop_email: string;
  shop_description: string;
  low_stock_threshold: string;
  default_order_status: OrderStatus;
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

// ─── Reusable Section Wrapper ─────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
          <Icon size={16} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

// ─── Field Components ─────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black text-slate-700 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 font-medium">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:bg-slate-50"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none disabled:opacity-50"
    />
  );
}

// ─── Feedback Toast ───────────────────────────────────────────────────────────

function Feedback({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;
  const isSuccess = feedback.type === "success";
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold border ${
      isSuccess
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-rose-50 text-rose-700 border-rose-200"
    }`}>
      {isSuccess
        ? <CheckCircle2 size={16} className="shrink-0" />
        : <AlertCircle size={16} className="shrink-0" />}
      {feedback.message}
    </div>
  );
}

// ─── Save Button ──────────────────────────────────────────────────────────────

function SaveButton({ loading, label = "Save Changes" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-slate-800 transition disabled:opacity-50"
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { data: session, update: updateSession } = useSession();

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    shop_name:            "",
    shop_email:           "",
    shop_description:     "",
    low_stock_threshold:  "5",
    default_order_status: "PENDING",
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingShop,    setSavingShop]    = useState(false);
  const [savingOrder,   setSavingOrder]   = useState(false);
  const [shopFeedback,  setShopFeedback]  = useState<FeedbackState>(null);
  const [orderFeedback, setOrderFeedback] = useState<FeedbackState>(null);

  // Profile state
  const [profileName,      setProfileName]      = useState("");
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]       = useState("");
  const [confirmPassword,  setConfirmPassword]   = useState("");
  const [showCurrent,      setShowCurrent]       = useState(false);
  const [showNew,          setShowNew]           = useState(false);
  const [savingProfile,    setSavingProfile]     = useState(false);
  const [profileFeedback,  setProfileFeedback]   = useState<FeedbackState>(null);

  // Load settings + pre-fill profile name
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/admin/settings");
        setSettings(res.data);
      } catch (err) {
        console.error("Load settings error:", err);
      } finally {
        setLoadingSettings(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (session?.user?.name) setProfileName(session.user.name);
  }, [session]);

  // Auto-clear feedback after 4s
  const withAutoClear = (setter: (v: FeedbackState) => void, value: FeedbackState) => {
    setter(value);
    setTimeout(() => setter(null), 4000);
  };

  // ── Save Shop Info ──
  const saveShopInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShop(true);
    try {
      await axios.patch("/api/admin/settings", {
        shop_name:        settings.shop_name,
        shop_email:       settings.shop_email,
        shop_description: settings.shop_description,
      });
      withAutoClear(setShopFeedback, { type: "success", message: "Shop info saved successfully" });
    } catch (err: any) {
      withAutoClear(setShopFeedback, {
        type: "error",
        message: err?.response?.data?.error || "Failed to save shop info",
      });
    } finally {
      setSavingShop(false);
    }
  };

  // ── Save Order Settings ──
  const saveOrderSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrder(true);
    try {
      await axios.patch("/api/admin/settings", {
        low_stock_threshold:  settings.low_stock_threshold,
        default_order_status: settings.default_order_status,
      });
      withAutoClear(setOrderFeedback, { type: "success", message: "Order settings saved successfully" });
    } catch (err: any) {
      withAutoClear(setOrderFeedback, {
        type: "error",
        message: err?.response?.data?.error || "Failed to save order settings",
      });
    } finally {
      setSavingOrder(false);
    }
  };

  // ── Save Profile ──
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation before hitting API
    if (newPassword && newPassword !== confirmPassword) {
      withAutoClear(setProfileFeedback, { type: "error", message: "New passwords do not match" });
      return;
    }
    if (newPassword && newPassword.length < 8) {
      withAutoClear(setProfileFeedback, { type: "error", message: "New password must be at least 8 characters" });
      return;
    }

    setSavingProfile(true);

    const payload: Record<string, string> = { name: profileName };
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword     = newPassword;
    }

    try {
      await axios.patch("/api/admin/profile", payload);
      // Update next-auth session so navbar name updates immediately
      await updateSession({ name: profileName });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      withAutoClear(setProfileFeedback, { type: "success", message: "Profile updated successfully" });
    } catch (err: any) {
      withAutoClear(setProfileFeedback, {
        type: "error",
        message: err?.response?.data?.error || "Failed to update profile",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <AdminSidebar />

      <main className="flex-1 lg:ml-64 p-8 lg:p-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Manage your shop configuration and admin profile.
          </p>
        </div>

        {loadingSettings ? (
          <div className="flex items-center gap-3 text-slate-400 animate-pulse">
            <Loader2 className="animate-spin" />
            <span className="font-bold uppercase tracking-widest text-xs">Loading settings...</span>
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">

            {/* ── 1. Shop Info ── */}
            <Section
              icon={Store}
              title="Shop Info"
              description="Public-facing details about your store"
            >
              <form onSubmit={saveShopInfo} className="space-y-4">
                <Field label="Shop Name">
                  <Input
                    value={settings.shop_name}
                    onChange={(e) => setSettings((s) => ({ ...s, shop_name: e.target.value }))}
                    placeholder="Jersey Shop"
                  />
                </Field>

                <Field label="Contact Email" hint="Used for order confirmations and support">
                  <Input
                    type="email"
                    value={settings.shop_email}
                    onChange={(e) => setSettings((s) => ({ ...s, shop_email: e.target.value }))}
                    placeholder="shop@example.com"
                  />
                </Field>

                <Field label="Shop Description">
                  <Textarea
                    rows={3}
                    value={settings.shop_description}
                    onChange={(e) => setSettings((s) => ({ ...s, shop_description: e.target.value }))}
                    placeholder="Premium football jerseys from the world's biggest clubs..."
                  />
                </Field>

                <Feedback feedback={shopFeedback} />
                <SaveButton loading={savingShop} />
              </form>
            </Section>

            {/* ── 2. Order Settings ── */}
            <Section
              icon={ShoppingBag}
              title="Order Settings"
              description="Default behaviours for new orders and inventory"
            >
              <form onSubmit={saveOrderSettings} className="space-y-4">

                <Field
                  label="Default Order Status"
                  hint="Status assigned to every new order at checkout"
                >
                  <div className="relative">
                    <select
                      value={settings.default_order_status}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, default_order_status: e.target.value as OrderStatus }))
                      }
                      className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </Field>

                <Field
                  label="Low Stock Threshold"
                  hint="Variants with stock at or below this number are flagged as low stock in inventory"
                >
                  <Input
                    type="number"
                    min={0}
                    value={settings.low_stock_threshold}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, low_stock_threshold: e.target.value }))
                    }
                    placeholder="5"
                  />
                </Field>

                <Feedback feedback={orderFeedback} />
                <SaveButton loading={savingOrder} />
              </form>
            </Section>

            {/* ── 3. Admin Profile ── */}
            <Section
              icon={User}
              title="Admin Profile"
              description="Update your display name and password"
            >
              <form onSubmit={saveProfile} className="space-y-4">

                <Field label="Display Name">
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </Field>

                {/* Read-only email */}
                <Field label="Email" hint="Email cannot be changed here">
                  <Input
                    value={session?.user?.email || ""}
                    disabled
                  />
                </Field>

                {/* Divider */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-4">
                    Change Password — leave blank to keep current
                  </p>

                  <div className="space-y-3">
                    <Field label="Current Password">
                      <div className="relative">
                        <Input
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>

                    <Field label="New Password" hint="Minimum 8 characters">
                      <div className="relative">
                        <Input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>

                    <Field label="Confirm New Password">
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                      />
                    </Field>
                  </div>
                </div>

                <Feedback feedback={profileFeedback} />
                <SaveButton loading={savingProfile} label="Update Profile" />
              </form>
            </Section>

          </div>
        )}
      </main>
    </div>
  );
}