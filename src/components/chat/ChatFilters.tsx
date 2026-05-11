"use client";

import React from "react";

interface ChatFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  unreadCount?: number;
}

/**
 * ==========================================
 * COMPONENT: ChatFilters
 * ==========================================
 */
export default function ChatFilters({ activeFilter, onFilterChange, unreadCount = 0 }: ChatFiltersProps) {
  const filters = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "groups", label: "Groups" },
  ];

  return (
    <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 border whitespace-nowrap active:scale-95 ${
            activeFilter === filter.id
              ? "bg-timber-brand text-white border-timber-brand shadow-lg shadow-timber-brand/20"
              : "bg-surface text-timber-brand border-timber-border hover:bg-elevated"
          }`}
        >
          {filter.label}
          {filter.count ? (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
              activeFilter === filter.id ? "bg-white text-timber-brand" : "bg-timber-brand text-white"
            }`}>
              {filter.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
