"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { NotificationsTable } from '@/components/admin/notifications/NotificationsTable';
import { NotificationsFilterBar } from '@/components/admin/notifications/NotificationsFilterBar';
import { NotificationDetailDrawer } from '@/components/admin/notifications/NotificationDetailDrawer';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/components/admin/shared/useToast';
import { Bell, RefreshCw } from 'lucide-react';

/**
 * ==========================================
 * PAGE: Notifications Log
 * ==========================================
 * Auditable record of all system notifications.
 * Includes bulk resend capabilities for failed dispatches.
 * Now includes drill-down details via side drawer.
 * ==========================================
 */
export default function NotificationsLogPage() {
  const { token } = useAdmin();
  const { addToast } = useToast();

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  const [failedCount, setFailedCount] = useState(0);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // Fetch the failed count for the Bulk Resend button label
  const fetchFailedCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/notification-logs/bulk-resend', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFailedCount(data.failedCount || 0);
      }
    } catch (err) {
      console.error('[FAILED_COUNT_FETCH]', err);
    }
  }, [token]);

  useEffect(() => {
    fetchFailedCount();
  }, [fetchFailedCount]);

  const handleBulkResend = async () => {
    if (!failedCount || bulkLoading) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/notification-logs/bulk-resend', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        addToast({ message: json.message || `${json.requeued} notifications re-queued`, type: 'success' });
        setFailedCount(0);
      } else {
        throw new Error(json.error || 'Bulk resend failed');
      }
    } catch (err: any) {
      addToast({ message: err.message, type: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(p => ({ ...p, page: newPage }));
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight">
              Notifications Log
            </h1>
          </div>
          <p className="text-[var(--color-muted)] font-sans">
            Tracking delivery status and debugging dispatch failures.
          </p>
        </div>
        
        <button 
          onClick={handleBulkResend}
          disabled={failedCount === 0 || bulkLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500 text-white text-sm font-sans font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${bulkLoading ? 'animate-spin' : ''}`} />
          {bulkLoading ? 'Resending...' : `Bulk Resend Failed (${failedCount})`}
        </button>
      </div>

      <div className="bg-[var(--color-surface)] rounded-3xl p-8 border border-[var(--color-border)] min-h-[600px]">
        <NotificationsFilterBar filters={filters} setFilters={setFilters} />
        <NotificationsTable 
          filters={filters} 
          page={pagination.page}
          onDataLoad={(p) => setPagination(p)}
          onViewDetails={setSelectedNotification}
        />
        
        {/* Pagination Footer */}
        <div className="mt-8 flex items-center justify-between">
           <p className="text-xs font-sans text-[var(--color-muted)]">
             Showing{' '}
             <span className="font-mono text-[var(--color-text)] font-bold">
               {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.total, pagination.page * pagination.limit)}
             </span>{' '}
             of{' '}
             <span className="font-mono text-[var(--color-text)] font-bold">
               {pagination.total.toLocaleString()}
             </span>{' '}
             logs
           </p>
           <div className="flex gap-2">
             <button 
               onClick={() => handlePageChange(pagination.page - 1)}
               disabled={pagination.page <= 1}
               className="px-4 py-2 rounded-full border border-[var(--color-border)] text-xs font-sans font-bold text-[var(--color-muted)] disabled:opacity-50 hover:bg-[var(--color-elevated)] transition-all"
             >
               Previous
             </button>
             <button 
               onClick={() => handlePageChange(pagination.page + 1)}
               disabled={pagination.page >= pagination.totalPages}
               className="px-4 py-2 rounded-full border border-[var(--color-border)] text-xs font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all disabled:opacity-50"
             >
               Next
             </button>
           </div>
        </div>
      </div>

      {/* Drill-down Detail Drawer */}
      <NotificationDetailDrawer 
        log={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
