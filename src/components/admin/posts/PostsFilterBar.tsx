import React from 'react';
import { Search, Filter, SortDesc } from 'lucide-react';

interface PostsFilterBarProps {
  filters: any;
  setFilters: (filters: any) => void;
}

export function PostsFilterBar({ filters, setFilters }: PostsFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
        <input 
          type="text" 
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          placeholder="Search posts by content or keyword..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] font-sans text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
      </div>

      {/* Action Buttons / Selects */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <select 
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
            className="appearance-none pl-10 pr-8 py-2.5 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] text-xs font-sans font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-all cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>
          <SortDesc className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)] pointer-events-none" />
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] text-xs font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all">
          <Filter className="w-3.5 h-3.5" />
          More Filters
        </button>
      </div>
    </div>
  );
}
