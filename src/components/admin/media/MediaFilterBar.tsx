"use client";

import React, { useState } from 'react';
import { Search, Image as ImageIcon, Video, Layers, Calendar, ChevronDown } from 'lucide-react';

export function MediaFilterBar({ filters, setFilters }: { filters: any, setFilters: (f: any) => void }) {
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      {/* Search Uploader */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search by uploader or file name..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-brand)] focus:outline-none text-sm font-sans transition-all duration-300"
        />
      </div>

      {/* Type Toggles */}
      <div className="flex items-center gap-1 p-1 bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-full h-12">
        <button 
          onClick={() => setFilters({ ...filters, type: 'all' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-bold transition-all ${
            filters.type === 'all' ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> All
        </button>
        <button 
          onClick={() => setFilters({ ...filters, type: 'image' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-bold transition-all ${
            filters.type === 'image' ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Images
        </button>
        <button 
          onClick={() => setFilters({ ...filters, type: 'video' })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-bold transition-all ${
            filters.type === 'video' ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> Videos
        </button>
      </div>

      {/* Date Picker (Pill) */}
      <div className="relative h-12">
        <button 
          onClick={() => setShowDateDropdown(!showDateDropdown)}
          className="flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all active:scale-95 h-full whitespace-nowrap"
        >
          <Calendar className="w-4 h-4 text-[var(--color-muted)]" />
          {filters.dateRange === 'all' ? 'All Time' : filters.dateRange === 'today' ? 'Today' : 'Last 30 Days'}
          <ChevronDown className={`w-4 h-4 text-[var(--color-muted)] transition-transform duration-300 ${showDateDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDateDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-20 overflow-hidden">
             {['all', 'today', 'last30'].map((range) => (
               <button 
                 key={range}
                 onClick={() => {
                   setFilters({ ...filters, dateRange: range });
                   setShowDateDropdown(false);
                 }}
                 className={`w-full px-4 py-3 text-left text-xs font-sans font-bold transition-colors ${
                   filters.dateRange === range ? 'text-[var(--color-brand)] bg-[var(--color-brand)]/5' : 'text-[var(--color-text)] hover:bg-[var(--color-elevated)]'
                 }`}
               >
                 {range === 'all' ? 'All Time' : range === 'today' ? 'Today' : 'Last 30 Days'}
               </button>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
