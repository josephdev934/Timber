"use client";

import React, { useState, useEffect } from 'react';
import { User, ShieldAlert, Ban, Trash2, Check, AlertTriangle, Printer, MoreVertical, ExternalLink } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { ConfirmModal } from '../shared/ConfirmModal';

export interface ReportDetailProps {
  reportId: string | null;
  onResolve?: () => void;
}

export function ReportDetail({ reportId, onResolve }: ReportDetailProps) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'dismiss' | 'content' | 'ban' | null;
  }>({
    isOpen: false,
    type: null
  });

  const fetchDetail = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("[REPORT_DETAIL_FETCH_FAILED]", err);
    } finally {
      setLoading(true); // Small delay feel
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchDetail();
    setBanReason("");
  }, [reportId]);

  const handleAction = async () => {
    const action = modalState.type;
    if (!reportId || !action) return;
    
    setActionLoading(action);
    setModalState({ isOpen: false, type: null });

    try {
      const method = action === 'content' ? 'DELETE' : 'PATCH';
      const endpoint = `/api/admin/reports/${reportId}/${action}`;
      
      const body = action === 'ban' ? JSON.stringify({ reason: banReason }) : undefined;

      const res = await fetch(endpoint, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body
      });

      if (res.ok) {
        addToast({ message: `Action successful: ${action}`, type: 'success' });
        
        if (action === 'dismiss') {
          // Clear right panel on dismiss
          if (onResolve) onResolve();
        } else if (action === 'content') {
          // Remove content preview
          setData((prev: any) => ({ ...prev, contentPreview: null, report: { ...prev.report, status: 'resolved' } }));
        } else {
          // Update status for ban
          fetchDetail();
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
    } catch (err: any) {
      addToast({ message: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirm = (type: 'dismiss' | 'content' | 'ban') => {
    setModalState({ isOpen: true, type });
  };

  if (!reportId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl border-dashed">
        <ShieldAlert className="w-16 h-16 text-[var(--color-muted)] opacity-20 mb-4" />
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-2">No Report Selected</h3>
        <p className="text-sm font-sans text-[var(--color-muted)] max-w-xs">
          Select a report from the queue to view details and take administrative action.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 space-y-8">
        <SkeletonLoader className="h-12 w-1/3 rounded-xl" />
        <SkeletonLoader className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-6">
          <SkeletonLoader className="h-24 w-full rounded-2xl" />
          <SkeletonLoader className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const { report, contentPreview } = data || {};
  if (!report) return null;

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--color-border)] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-[var(--color-text)]">Report Detail: #{report._id.slice(-6).toUpperCase()}</h2>
          <p className="text-xs font-sans text-[var(--color-muted)] mt-1">
            Filed on {new Date(report.createdAt).toLocaleDateString('en-GB')} · <span className="font-mono">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            report.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
            report.status === 'resolved' ? 'bg-green-500/10 text-green-500' : 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]'
          }`}>
            {report.status}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin space-y-8">
        {/* Content Block */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-red-500 mb-2">
             <AlertTriangle className="w-4 h-4" />
             <span className="text-xs font-bold uppercase tracking-widest">Flagged {report.contentType} Content</span>
           </div>
           
           <div className="p-6 rounded-3xl bg-[var(--color-elevated)] border border-[var(--color-border)] italic font-sans text-[var(--color-text)] leading-relaxed relative group">
             {contentPreview ? (
               <div className="space-y-4">
                 {/* Text content */}
                 <p className="text-sm font-sans text-[var(--color-text)]">
                   {contentPreview.text || contentPreview.content || contentPreview.description || "No text description."}
                 </p>

                 {/* Single Media (from Media collection or Message) */}
                 {(contentPreview.url || contentPreview.mediaUrl) && (
                    <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-black max-w-md mx-auto">
                       {(contentPreview.type === 'video' || contentPreview.mediaType === 'video') ? (
                         <video src={contentPreview.url || contentPreview.mediaUrl} controls className="w-full h-auto" />
                       ) : (
                         <img src={contentPreview.url || contentPreview.mediaUrl} className="w-full h-auto object-contain" />
                       )}
                    </div>
                 )}

                 {/* Multi Media (from Post) */}
                 {(contentPreview.images && contentPreview.images.length > 0) && (
                   <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                     {contentPreview.images.map((url: string, i: number) => (
                       <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[var(--color-border)]">
                         <img src={url} className="w-full h-full object-cover" />
                       </div>
                     ))}
                   </div>
                 )}

                 {contentPreview.video && (
                   <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-black max-w-md mx-auto">
                      <video src={contentPreview.video} controls className="w-full h-auto" />
                   </div>
                 )}
               </div>
             ) : (
               <div className="text-[var(--color-muted)]">
                 Content record not found (may have been deleted already).
               </div>
             )}
             
             <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[10px] font-mono font-bold uppercase">
                  Reason: {report.reason}
                </span>
             </div>
           </div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reporter Card */}
          <div className="p-4 rounded-3xl bg-[var(--color-elevated)]/30 border border-[var(--color-border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden">
               {report.reporterId?.profilePhoto ? (
                 <img src={report.reporterId.profilePhoto} className="w-full h-full object-cover" />
               ) : (
                 <User className="w-6 h-6 text-[var(--color-muted)]" />
               )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold font-sans text-[var(--color-muted)] uppercase tracking-widest mb-1">Reporter</p>
              <p className="text-sm font-bold font-sans text-[var(--color-text)] truncate">{report.reporterId?.name || `@${report.reporterId?.username}` || 'Unknown'}</p>
              <p className="text-[10px] font-mono text-[var(--color-muted)]">@{report.reporterId?.username}</p>
            </div>
          </div>

          {/* Reported Card */}
          <div className="p-4 rounded-3xl bg-[var(--color-elevated)]/30 border border-[var(--color-border)] flex items-center gap-4 border-red-500/10">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 overflow-hidden">
               {report.reportedUserId?.profilePhoto ? (
                 <img src={report.reportedUserId.profilePhoto} className="w-full h-full object-cover" />
               ) : (
                 <User className="w-6 h-6 text-red-500" />
               )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold font-sans text-red-500 uppercase tracking-widest mb-1">Reported User</p>
              <p className="text-sm font-bold font-sans text-red-500 truncate">{report.reportedUserId?.name || `@${report.reportedUserId?.username}` || 'Unknown'}</p>
              <p className="text-[10px] font-mono text-red-500 opacity-70">
                {report.reportedUserId?.isBanned ? "STATUS: BANNED" : `Reports: ${report.reportedUserId?.reportCount || 0}`}
              </p>
            </div>
          </div>
        </div>

        {report.status === 'pending' && (
          <div className="pt-6 border-t border-[var(--color-border)] animate-in slide-in-from-bottom-4 duration-500">
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-3 px-1">Administrative Note / Ban Reason</label>
            <textarea 
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Provide a reason for the ban or internal note for resolution..."
              className="w-full h-24 p-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-brand)] focus:outline-none text-sm font-sans resize-none transition-all"
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {report.status === 'pending' ? (
        <div className="p-6 bg-[var(--color-elevated)]/30 border-t border-[var(--color-border)] flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={() => openConfirm('dismiss')}
            disabled={!!actionLoading}
            className="px-6 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-emerald-500" /> {actionLoading === 'dismiss' ? 'Dismissing...' : 'Dismiss Report'}
          </button>
          <button 
             onClick={() => openConfirm('content')}
             disabled={!!actionLoading || !contentPreview}
             className="px-6 py-2.5 rounded-full bg-[#4A3D35] text-white text-sm font-sans font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> {actionLoading === 'content' ? 'Removing...' : 'Remove Content'}
          </button>
          <button 
             onClick={() => openConfirm('ban')}
             disabled={!!actionLoading || report.reportedUserId?.isBanned}
             className="px-6 py-2.5 rounded-full bg-red-600 text-white text-sm font-sans font-bold hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            <Ban className="w-4 h-4" /> {actionLoading === 'ban' ? 'Banning...' : 'Ban User'}
          </button>
        </div>
      ) : (
        <div className="p-6 bg-green-500/5 border-t border-[var(--color-border)] flex items-center justify-center gap-3">
           <Check className="w-5 h-5 text-green-500" />
           <span className="text-sm font-sans font-bold text-green-600">
             Report Resolved by {report.resolvedBy?.name || 'Admin'} on {new Date(report.resolvedAt).toLocaleDateString('en-GB')}
           </span>
        </div>
      )}

      {/* MODALS */}
      <ConfirmModal 
        isOpen={modalState.isOpen}
        title={`${modalState.type?.toUpperCase()} ACTION`}
        description={`Are you sure you want to ${modalState.type} this report? This action will be logged in the audit system.`}
        isLoading={!!actionLoading}
        onConfirm={handleAction}
        onCancel={() => setModalState({ isOpen: false, type: null })}
      />
    </div>
  );
}
