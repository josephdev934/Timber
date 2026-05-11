"use client";

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { socketClient } from '@/infrastructure/socket/socketClient';

export interface ReportsListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReportsList({ selectedId, onSelect }: ReportsListProps) {
  const { token } = useAdmin();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [newReportIds, setNewReportIds] = useState<Set<string>>(new Set());

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (err) {
      console.error("[REPORTS_FETCH_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [token, activeTab]);

  // Socket.IO Integration
  useEffect(() => {
    if (!token) return;

    const socket = socketClient.getInstance();
    
    const handleConnect = () => {
      socketClient.joinRoom('admin:reports');
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const handleNewReport = (data: any) => {
      const report = data.payload || data;
      // Only prepend if we are on the pending tab
      if (activeTab === 'pending') {
        setReports(prev => [report, ...prev]);
        
        // Add to highlights
        const id = report._id;
        setNewReportIds(prev => new Set(prev).add(id));
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
          setNewReportIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 2000);
      }
    };

    socket.on('REPORT_SUBMITTED', handleNewReport);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('REPORT_SUBMITTED', handleNewReport);
      socketClient.leaveRoom('admin:reports');
    };
  }, [token, activeTab]);

  const getSeverity = (reason: string) => {
    const high = ['Hate Speech', 'Harassment', 'Sexual Content', 'Illegal Acts'];
    if (high.some(r => reason.toLowerCase().includes(r.toLowerCase()))) return 'high';
    return 'medium';
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-elevated)]/20">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['pending', 'resolved', 'dismissed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-bold transition-all capitalize whitespace-nowrap ${
                activeTab === tab ? 'bg-[var(--color-text)] text-[var(--color-bg)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[var(--color-border)]">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <SkeletonLoader key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report._id}
              onClick={() => onSelect(report._id)}
              className={`p-5 cursor-pointer transition-all duration-300 relative group hover:bg-[var(--color-elevated)] ${
                selectedId === report._id ? 'bg-[var(--color-elevated)] border-l-4 border-l-[var(--color-brand)]' : ''
              } ${newReportIds.has(report._id) ? 'bg-amber-500/10 animate-pulse' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase tracking-tighter ${
                  getSeverity(report.reason) === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {report.reason}
                </span>
                <span className="text-[10px] font-mono text-[var(--color-muted)]">
                  {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <p className="text-sm font-bold font-sans text-[var(--color-text)] mb-1">
                Flagged {report.contentType}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 rounded-full bg-[var(--color-elevated)] overflow-hidden shrink-0 border border-[var(--color-border)]">
                  {report.reporterId?.profilePhoto && <img src={report.reporterId.profilePhoto} className="w-full h-full object-cover" />}
                </div>
                <span className="text-[10px] font-sans text-[var(--color-muted)]">
                  by @{report.reporterId?.username || 'unknown'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                 <span className={`text-[9px] font-bold uppercase tracking-widest ${
                   getSeverity(report.reason) === 'high' ? 'text-red-500' : 'text-amber-500'
                 }`}>
                   {getSeverity(report.reason)} Severity
                 </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-sm font-sans text-[var(--color-muted)] italic">No {activeTab} reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
