"use client";

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export interface GroupViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export function GroupViewToggle({ view, onViewChange }: GroupViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-full">
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded-full transition-all duration-300 active:scale-95 ${
          view === 'grid' 
            ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20' 
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded-full transition-all duration-300 active:scale-95 ${
          view === 'list' 
            ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20' 
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
