"use client";

import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { PostsTable } from '@/components/admin/posts/PostsTable';
import { PostsFilterBar } from '@/components/admin/posts/PostsFilterBar';

/**
 * ==========================================
 * PAGE: Posts & Comments Moderation
 * ==========================================
 * Real-time content queue for community oversight.
 * Supports keyword auditing and bulk moderation actions.
 * ==========================================
 */
export default function PostsPage() {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'newest'
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const handlePageChange = (newPage: number) => {
    setPagination(p => ({ ...p, page: newPage }));
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight">
              Posts & Comments
            </h1>
          </div>
          <p className="text-[var(--color-muted)] font-sans">
            Oversee all community discussions and moderate content threads.
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-brand)] text-white text-sm font-sans font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[var(--color-brand)]/20">
          <Plus className="w-4 h-4" /> Global Announcement
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 min-h-[600px] flex flex-col shadow-sm">
        <PostsFilterBar filters={filters} setFilters={setFilters} />
        
        <div className="flex-1">
          <PostsTable 
            filters={filters} 
            page={pagination.page} 
            onDataLoad={(p) => setPagination(p)} 
          />
        </div>

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
            <p className="text-xs font-sans text-[var(--color-muted)]">
              Showing{' '}
              <span className="font-mono text-[var(--color-text)] font-bold">
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.total, pagination.page * pagination.limit)}
              </span>{' '}
              of{' '}
              <span className="font-mono text-[var(--color-text)] font-bold">
                {pagination.total.toLocaleString()}
              </span>{' '}
              posts
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-6 py-2 rounded-full border border-[var(--color-border)] text-xs font-sans font-bold text-[var(--color-muted)] disabled:opacity-50 hover:bg-[var(--color-elevated)] transition-all"
              >
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-6 py-2 rounded-full border border-[var(--color-border)] text-xs font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
