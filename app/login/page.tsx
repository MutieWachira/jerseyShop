"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {

    e.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {

      const res = await signIn("credentials", {
        redirect: false,
        email,
        password
      });

      if (!res || res.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Fetch session to determine user role
      const session = await getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const role = (session.user as any)?.role;

      // Role based routing
      if (role === "ADMIN") {
        router.push("/admin");
      } 
      else if (role === "USER") {
        router.push("/shop");
      } 
      else {
        router.push("/dashboard");
      }

    } catch (err) {

      console.error(err);
      setError("Unexpected server error");

    } finally {

      setLoading(false);

    }

  }

  return (

    <main className="min-h-screen bg-white flex items-center justify-center">

      <div className="w-full max-w-md rounded-2xl border border-slate-200 p-8 shadow-sm">

        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
          Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div>
            <label className="text-sm text-slate-600">Email</label>

            <input
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="text-slate-600 mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">Password</label>

            <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="text-slate-600 mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />

             <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-900"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.01-2.26 2.77-4.15 4.94-5.35M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                )}
              </button>

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="flex items-center gap-4 my-6">

            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-200"></div>

          </div>

          <div className="space-y-3">

            <button
              type="button"
              onClick={()=>signIn("google", { callbackUrl: "/dashboard" })}
              className="text-slate-600 w-full flex items-center justify-center gap-3 border border-slate-300 rounded-xl py-3 hover:bg-slate-50 transition"
            >

              <img src="/google.svg" alt="Google" className="w-5 h-5"/>

              Continue with Google

            </button>

            <button
              type="button"
              onClick={()=>signIn("apple", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 bg-black text-white rounded-xl py-3 hover:opacity-90 transition"
            >

              Continue with Apple

            </button>

          </div>

        </form>

        <p className="text-sm text-center text-slate-600 mt-6">

          Don't have an account?{" "}

          <Link
            href="/register"
            className="font-semibold text-slate-900 hover:underline"
          >
            Sign Up
          </Link>

        </p>

        <Link
          href="/reset-password"
          className="block text-sm text-center mt-2 text-slate-600 hover:underline"
        >
          Forgot password?
        </Link>

      </div>

    </main>

  );

}