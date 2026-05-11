"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

/**
 * ==========================================
 * PAGE: Login
 * ==========================================
 */
import { useSettings } from "@/context/SettingsContext";

export default function LoginPage() {
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-page p-6">
      <div className="w-full max-w-md bg-surface p-8 rounded-[2.5rem] border border-timber-border shadow-xl shadow-timber-brand/5">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-timber-brand rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-timber-brand/30 transform -rotate-3">
            <span className="text-2xl text-white font-bold tracking-tighter">
              {settings?.general?.platformName?.[0] || 'T'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-timber-text tracking-tight mb-2">
            Welcome to {settings?.general?.platformName || 'Timber'}
          </h1>
          <p className="text-timber-muted text-sm">Enter your credentials to continue your journey.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 text-red-600 text-sm rounded-2xl text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-timber-muted tracking-[0.2em] uppercase ml-4">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full bg-timber-input-bg border-none text-timber-text placeholder-timber-placeholder rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-timber-brand/20 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
              <label className="text-[10px] font-bold text-timber-text tracking-[0.2em] uppercase">
                Password
              </label>
              <button type="button" className="text-[10px] font-bold text-timber-brand tracking-[0.1em] uppercase hover:underline">
                Forgot?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-timber-input-bg border-none rounded-2xl py-4 px-6 text-timber-text placeholder-timber-placeholder text-sm focus:ring-2 focus:ring-timber-brand/20 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-timber-brand text-white font-bold py-4 rounded-2xl shadow-lg shadow-timber-brand/30 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-timber-muted text-xs">
            Don't have an account?{" "}
            <Link href="/register" className="text-timber-brand font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
