"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

/**
 * ==========================================
 * COMPONENT: Header
 * ==========================================
 */
import { useSettings } from "@/context/SettingsContext";

export default function Header() {
  const { user } = useAuth();
  const { settings } = useSettings();

  return (
    <header className="h-16 px-6 bg-surface border-b border-timber-border sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-xl font-bold text-timber-text tracking-tight">
          {settings?.general?.platformName || "Timber"}
        </Link>
      </div>
      
      <button className="p-2 text-timber-brand hover:bg-elevated rounded-full transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </header>
  );
}
