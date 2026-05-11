"use client";

import React from 'react';
import { Search, Filter, ChevronDown, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function NotificationsFilterBar({ filters, setFilters }: { filters: any, setFilters: (f: any) => void }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      {/* Search Recipient */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search by recipient name or description..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-brand)] focus:outline-none text-sm font-sans transition-all duration-300"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-full h-12">
        <button 
          onClick={() => setFilters({ ...filters, status: 'all' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-bold transition-all ${
            filters.status === 'all' ? 'bg-[var(--color-text)] text-[var(--color-bg)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setFilters({ ...filters, status: 'delivered' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-bold transition-all ${
            filters.status === 'delivered' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
        </button>
        <button 
          onClick={() => setFilters({ ...filters, status: 'failed' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-bold transition-all ${
            filters.status === 'failed' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Failed
        </button>
        <button 
          onClick={() => setFilters({ ...filters, status: 'pending' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-bold transition-all ${
            filters.status === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending
        </button>
      </div>
    </div>
  );
}
