"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {

  const [email, setEmail] = useState("");

  function handleReset(e: React.FormEvent) {
    e.preventDefault();

    console.log("Reset password email sent to:", email);
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">

      <div className="w-full max-w-md rounded-2xl border border-slate-200 p-8">

        <h1 className="text-2xl font-bold text-slate-900 mb-4 text-center">
          Reset Password
        </h1>

        <p className="text-sm text-slate-600 text-center mb-6">
          Enter your email and we will send you instructions to reset your password.
        </p>

        <form onSubmit={handleReset} className="space-y-4">

          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3 text-white font-semibold hover:bg-slate-800"
          >
            Send Reset Link
          </button>

        </form>

        <p className="text-sm text-center text-slate-600 mt-6">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-slate-900 hover:underline"
          >
            Back to Login
          </Link>
        </p>

      </div>

    </main>
  );
}