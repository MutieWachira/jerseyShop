"use client";

import { FormEvent, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function NewPasswordPage() {
  const router = useRouter();
  const params = useParams(); // ✅ Gets the [token] from URL
  const token = params?.token;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "Passwords do not match." });
    }

    setLoading(true);
    setMessage(null);

    try {
      if (!token) {
        throw new Error("Reset token is missing or invalid.");
      }

      const res = await fetch("/api/auth/reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      setMessage({ type: "success", text: "Password updated! Redirecting to login..." });
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-slate-200 p-8 rounded-2xl shadow-sm">
        {!token ? (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Invalid reset link</h2>
            <p className="text-sm text-slate-600">
              The password reset link is missing or invalid. Please request a new link from the login page.
            </p>
            <button
              type="button"
              onClick={() => router.push("/reset-password")}
              className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-white font-semibold hover:bg-slate-800"
            >
              Request a new link
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">New Password</h1>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                required
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                disabled={loading}
              />
              <input
                type="password"
                required
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                disabled={loading}
              />
              <button
                disabled={loading}
                className="w-full bg-slate-900 py-3 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
