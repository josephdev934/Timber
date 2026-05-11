"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

/**
 * ==========================================
 * PAGE: Register
 * ==========================================
 */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-page p-6">
      <div className="w-full max-w-md bg-surface p-8 rounded-[2.5rem] border border-timber-border shadow-xl shadow-timber-brand/5">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-timber-text tracking-tight mb-2">Create Account</h1>
          <p className="text-timber-muted text-sm">Join the Timber community today.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 text-red-600 text-sm rounded-2xl text-center font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-timber-muted tracking-[0.2em] uppercase ml-4">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="Julian Thorne"
              className="w-full bg-timber-input-bg border-none text-timber-text placeholder-timber-placeholder rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-timber-brand/20 transition-all"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-timber-muted tracking-[0.2em] uppercase ml-4">
              Username
            </label>
            <input
              name="username"
              type="text"
              placeholder="jthorne"
              className="w-full bg-timber-input-bg border-none text-timber-text placeholder-timber-placeholder rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-timber-brand/20 transition-all"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-timber-muted tracking-[0.2em] uppercase ml-4">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              placeholder="name@company.com"
              className="w-full bg-timber-input-bg border-none text-timber-text placeholder-timber-placeholder rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-timber-brand/20 transition-all"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-timber-muted tracking-[0.2em] uppercase ml-4">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className="w-full bg-timber-input-bg border-none text-timber-text placeholder-timber-placeholder rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-timber-brand/20 transition-all"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-timber-brand text-white font-bold py-4 rounded-2xl shadow-lg shadow-timber-brand/30 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Creating Account..." : "Join Timber"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-timber-muted text-xs">
            Already have an account?{" "}
            <Link href="/login" className="text-timber-brand font-bold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
