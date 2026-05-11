"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Filter, X, Download } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

interface UsersFilterBarProps {
  filters: any;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  onRefresh: () => void;
}

export function UsersFilterBar({ filters, setFilters, onRefresh }: UsersFilterBarProps) {
  const { token } = useAdmin();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced Search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters((f: any) => ({ ...f, search: searchTerm, page: 1 }));
      }
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/users/export', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timber_users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("[EXPORT_FAILED]", err);
    }
  };

  const clearFilter = (key: string) => {
    setFilters((f: any) => ({ ...f, [key]: key === 'page' ? 1 : 'all', page: 1 }));
    if (key === 'search') setSearchTerm('');
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-brand)] focus:outline-none text-sm font-sans transition-all duration-300 shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)] text-sm font-sans font-medium text-[var(--color-text)] transition-all duration-300 active:scale-95 shadow-sm">
              Status: <span className="capitalize text-[var(--color-brand)]">{filters.status}</span>
              <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />
            </button>
            <div className="absolute top-full mt-2 right-0 w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-2">
              {['all', 'active', 'banned'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilters((f: any) => ({ ...f, status, page: 1 }))}
                  className="w-full text-left px-4 py-2 rounded-xl text-sm font-sans hover:bg-[var(--color-elevated)] capitalize"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-elevated)] text-[var(--color-text)] text-sm font-sans font-bold border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all duration-300 active:scale-95 whitespace-nowrap shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Active Filters Row */}
      {(filters.search || filters.status !== 'all') && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none animate-in fade-in slide-in-from-left-2">
          {filters.search && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 text-[var(--color-brand)] text-xs font-sans font-medium whitespace-nowrap">
              Search: {filters.search}
              <X className="w-3 h-3 cursor-pointer hover:scale-125 transition-transform" onClick={() => clearFilter('search')} />
            </div>
          )}
          {filters.status !== 'all' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 text-[var(--color-brand)] text-xs font-sans font-medium whitespace-nowrap">
              Status: {filters.status}
              <X className="w-3 h-3 cursor-pointer hover:scale-125 transition-transform" onClick={() => clearFilter('status')} />
            </div>
          )}
          <button 
            onClick={() => {
              setFilters((f: any) => ({ ...f, search: '', status: 'all', page: 1 }));
              setSearchTerm('');
            }}
            className="text-xs font-sans font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] px-2 transition-colors whitespace-nowrap"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
