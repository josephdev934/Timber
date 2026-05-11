"use client";

import React, { useState, useEffect } from 'react';
import { GroupsTable } from '@/components/admin/groups/GroupsTable';
import { GroupsGrid } from '@/components/admin/groups/GroupsGrid';
import { GroupViewToggle } from '@/components/admin/groups/GroupViewToggle';
import { GroupDetailDrawer } from '@/components/admin/groups/GroupDetailDrawer';
import { useAdmin } from '@/context/AdminContext';
import { Search, ChevronDown } from 'lucide-react';

export default function GroupsPage() {
  const { token } = useAdmin();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Central Filter State
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 20
  });

  const [data, setData] = useState<any>({ groups: [], pagination: { total: 0, page: 1, totalPages: 1 } });
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        search: filters.search,
        status: filters.status
      });

      const res = await fetch(`/api/admin/groups?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("[GROUPS_FETCH_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchGroups();
  }, [token, filters]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight mb-2">
            Groups
          </h1>
          <p className="text-[var(--color-muted)] font-sans">
            Managing {data.pagination.total || '...'} community collectives and private channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GroupViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search groups by name..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-brand)] focus:outline-none text-sm font-sans transition-all duration-300"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)] text-sm font-sans font-medium text-[var(--color-text)] transition-all duration-300 active:scale-95">
              Status: <span className="capitalize text-[var(--color-brand)]">{filters.status}</span>
              <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />
            </button>
            <div className="absolute top-full mt-2 right-0 w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-2">
              {['all', 'active', 'archived'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilters(f => ({ ...f, status: s, page: 1 }))}
                  className="w-full text-left px-4 py-2 rounded-xl text-sm font-sans hover:bg-[var(--color-elevated)] capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <GroupsTable 
          groups={data.groups}
          pagination={data.pagination}
          loading={loading}
          onPageChange={(page) => setFilters(f => ({ ...f, page }))}
          onGroupClick={(id) => setSelectedGroupId(id)}
          onRefresh={fetchGroups}
        />
      ) : (
        <>
          <GroupsGrid 
            groups={data.groups}
            loading={loading}
            onGroupClick={(id) => setSelectedGroupId(id)}
          />
          {/* Simple Grid Pagination */}
          {!loading && data.pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
               <button 
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="px-6 py-2 rounded-full border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm font-mono text-[var(--color-muted)]">
                Page {filters.page} of {data.pagination.totalPages}
              </span>
              <button 
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= data.pagination.totalPages}
                className="px-6 py-2 rounded-full border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <GroupDetailDrawer 
        groupId={selectedGroupId} 
        onClose={() => setSelectedGroupId(null)} 
      />
    </div>
  );
}
