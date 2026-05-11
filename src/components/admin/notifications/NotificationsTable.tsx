import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MessageSquare, 
  UserPlus, 
  ShieldAlert, 
  RefreshCw, 
  User,
  ExternalLink 
} from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { useAdmin } from '@/context/AdminContext';

interface NotificationsTableProps {
  filters: any;
  page?: number;
  onDataLoad?: (pagination: any) => void;
  onViewDetails?: (log: any) => void;
}

/**
 * ==========================================
 * COMPONENT: NotificationsTable
 * ==========================================
 * Renders a paginated list of notification logs.
 * Supports drill-down into payload details.
 * ==========================================
 */
export function NotificationsTable({ filters, page = 1, onDataLoad, onViewDetails }: NotificationsTableProps) {
  const { token } = useAdmin();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          status: filters.status,
          type: filters.type,
          search: filters.search || '',
          page: page.toString()
        });
        const res = await fetch(`/api/admin/notification-logs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          if (onDataLoad) onDataLoad(data.pagination);
        }
      } catch (err) {
        console.error("[NOTIF_LOGS_FETCH_FAILED]", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchLogs, 300);
    return () => clearTimeout(timer);
  }, [token, filters, page]);

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'MESSAGE': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'GROUP': return <UserPlus className="w-3.5 h-3.5" />;
      case 'SYSTEM': return <ShieldAlert className="w-3.5 h-3.5" />;
      default: return <Bell className="w-3.5 h-3.5" />;
    }
  };

  const handleResend = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/notification-logs/${id}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Notification resend triggered");
      }
    } catch (err) {
      console.error("[RESEND_FAILED]", err);
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--color-elevated)] rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-elevated)]/30">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Recipient</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Trigger Description</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-[var(--color-muted)] italic">
                  No notification logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr 
                  key={log.id || log._id} 
                  onClick={() => onViewDetails?.(log)}
                  className="hover:bg-[var(--color-elevated)]/30 transition-all duration-300 group animate-in fade-in slide-in-from-left-2 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="inline-flex p-2 rounded-xl bg-[var(--color-elevated)] border border-[var(--color-border)] text-[var(--color-muted)]">
                      {getTypeIcon(log.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden">
                        {log.recipientId?.profilePhoto ? (
                          <img src={log.recipientId.profilePhoto} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-[var(--color-muted)] opacity-50" />
                        )}
                      </div>
                      <span className="text-sm font-bold font-sans text-[var(--color-text)]">
                        {log.recipientId?.name || log.recipientId?.username || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-sans text-[var(--color-text)] max-w-xs truncate">{log.payload?.message || log.body || log.title}</p>
                    {log.error && <p className="text-[10px] font-mono text-red-500 mt-0.5">{log.error}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-[var(--color-muted)]">
                      {new Date(log.sentAt || log.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {log.status === 'failed' ? (
                      <button 
                        onClick={(e) => handleResend(log.id || log._id, e)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-brand)] text-white text-[10px] font-bold font-sans uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--color-brand)]/20"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(log);
                        }}
                        className="p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)] transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
