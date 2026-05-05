"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "../../../../components/ThemeProvider";

type Mode = "signin" | "signup";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (phone.length < 10) {
      setError("Phone number must be at least 10 digits.");
      return;
    }
    if (password.length < 3) {
      setError("Password must be at least 3 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "signin"
            ? "Invalid phone number or password."
            : "Could not create account. Phone number may already exist.",
        );
      } else {
        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#111633] to-[#0a0e1a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow — same as landing page */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top bar with theme toggle */}
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4">
        <a
          href="/"
          className="flex items-center gap-0.5 font-extrabold text-2xl tracking-tight select-none hover:opacity-80 transition-opacity"
        >
          <span className="text-blue-400">Pay</span>
          <span className="text-purple-400">Flow</span>
        </a>
        <ThemeToggle className="!bg-white/10 !text-white/70 hover:!bg-white/20 hover:!text-white" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl shadow-purple-900/40 mb-4">
            <span className="text-white text-2xl font-bold">₹</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              PayFlow
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Fast, secure digital payments
          </p>
        </div>

        {/* Card — glassmorphism matching landing style */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/[0.06] rounded-2xl p-1 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "signin"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "signup"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                  +91
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
                  }
                  placeholder="9876543210"
                  required
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-purple-900/30 hover:shadow-purple-700/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </>
              ) : mode === "signin" ? (
                "Sign In →"
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          {/* Helper text */}
          <p className="text-center text-gray-500 text-xs mt-6">
            {mode === "signin"
              ? "Don't have an account? Switch to Sign Up above."
              : "Already have an account? Switch to Sign In above."}
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} PayFlow · Secure · Fast · Reliable
        </p>
      </div>
    </div>
  );
}
