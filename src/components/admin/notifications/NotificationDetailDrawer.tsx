"use client";

import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  MessageSquare, 
  UserPlus, 
  ShieldAlert, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Copy,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { useToast } from '../shared/useToast';

/**
 * ==========================================
 * COMPONENT: NotificationDetailDrawer
 * ==========================================
 * Side-drawer for inspecting specific notification logs.
 * Shows payload details and delivery status.
 * ==========================================
 */

export interface NotificationDetailDrawerProps {
  log: any | null;
  onClose: () => void;
}

export function NotificationDetailDrawer({ log, onClose }: NotificationDetailDrawerProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'payload'>('details');

  if (!log) return null;

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
    addToast({ message: "Payload copied to clipboard", type: 'success' });
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'MESSAGE': return <MessageSquare className="w-5 h-5" />;
      case 'GROUP': return <UserPlus className="w-5 h-5" />;
      case 'SYSTEM': return <ShieldAlert className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-elevated)]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-brand)] shadow-sm">
              {getTypeIcon(log.type)}
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-[var(--color-text)] leading-tight">Dispatch Audit</h2>
              <p className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-widest">{log.type} Log</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)] transition-all duration-300 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-8">
            {/* Status Card */}
            <div className={`mb-8 p-6 rounded-3xl border ${
              log.status === 'delivered' ? 'bg-emerald-500/5 border-emerald-500/20' : 
              log.status === 'failed' ? 'bg-red-500/5 border-red-500/20' : 
              'bg-amber-500/5 border-amber-500/20'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {log.status === 'delivered' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                   log.status === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> : 
                   <Clock className="w-4 h-4 text-amber-500" />}
                  <span className="text-sm font-bold font-sans text-[var(--color-text)] capitalize">{log.status}</span>
                </div>
                <StatusBadge status={log.status} />
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Dispatch ID</p>
                <p className="text-xs font-mono text-[var(--color-text)] truncate opacity-70">{log._id || log.id}</p>
              </div>

              {log.failureReason && (
                <div className="mt-4 pt-4 border-t border-red-500/10">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-sans text-red-500 leading-relaxed">{log.failureReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[var(--color-border)] mb-8">
              <button 
                onClick={() => setActiveTab('details')}
                className={`pb-4 text-sm font-bold font-sans transition-all relative ${activeTab === 'details' ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}
              >
                Details
                {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-brand)] rounded-t-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('payload')}
                className={`pb-4 text-sm font-bold font-sans transition-all relative ${activeTab === 'payload' ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}
              >
                Raw Payload
                {activeTab === 'payload' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-brand)] rounded-t-full" />}
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Recipient Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--color-muted)]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Recipient</h3>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] overflow-hidden">
                      {log.recipientId?.profilePhoto ? (
                        <img src={log.recipientId.profilePhoto} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] opacity-50">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold font-sans text-[var(--color-text)]">{log.recipientId?.name || 'Unknown User'}</p>
                      <p className="text-xs font-mono text-[var(--color-muted)]">@{log.recipientId?.username || 'unknown'}</p>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[var(--color-muted)]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Notification Body</h3>
                  </div>
                  <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-brand)] opacity-30" />
                    <p className="text-sm font-sans text-[var(--color-text)] leading-relaxed italic">
                      "{log.payload?.message || log.body || log.title || 'No message content'}"
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[var(--color-muted)]">Queued at</span>
                      <span className="font-mono text-[var(--color-text)]">{new Date(log.sentAt || log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.deliveredAt && (
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-emerald-500 font-bold">Delivered at</span>
                        <span className="font-mono text-[var(--color-text)]">{new Date(log.deliveredAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Payload Structure</h3>
                  <button 
                    onClick={copyPayload}
                    className="flex items-center gap-2 text-xs font-bold font-sans text-[var(--color-brand)] hover:opacity-80 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy JSON
                  </button>
                </div>
                <div className="p-6 rounded-2xl bg-[#0F0E0D] border border-white/5 font-mono text-[11px] text-[#A08C7A] overflow-x-auto">
                  <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-elevated)]/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Metadata</span>
              <span className="text-xs font-mono text-[var(--color-text)] opacity-60">
                {log.payload?.metadata?.chatId ? `Chat: ${log.payload.metadata.chatId.substring(0,8)}...` : 
                 log.payload?.metadata?.contentId ? `Post: ${log.payload.metadata.contentId.substring(0,8)}...` : 
                 'No persistent metadata'}
              </span>
            </div>
          </div>
          {log.payload?.metadata?.chatId && (
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-sans text-sm font-bold hover:bg-[var(--color-brand)]/20 transition-all">
              <ExternalLink className="w-4 h-4" /> View Context
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
