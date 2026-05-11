"use client";

import React, { useState } from 'react';
import { Trash2, ShieldAlert, WifiOff, Database } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';

export function DangerZone({ onUpdate }: { onUpdate?: () => void }) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const isConfirmed = confirmText === "CONFIRM";

  // Map UI action IDs → exact API path segments expected by /api/admin/settings/danger/:action
  const ACTION_MAP: Record<string, string> = {
    'wipe-test-data': 'wipe-data',
    'force-reset':    'force-disconnect',
    'clear-cache':    'clear-redis',
  };

  const handleDangerAction = async (action: 'wipe-test-data' | 'force-reset' | 'clear-cache') => {
    if (!isConfirmed) return;
    setLoadingAction(action);
    try {
      const apiAction = ACTION_MAP[action];
      const res = await fetch(`/api/admin/settings/danger/${apiAction}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        addToast({ message: json.message || `Action successful: ${action}`, type: 'success' });
        if (onUpdate) onUpdate();
        setConfirmText("");
      } else {
        throw new Error(json.error || 'Action failed');
      }
    } catch (err: any) {
      addToast({ message: err.message || `Action failed: ${action}`, type: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold font-sans text-red-500 mb-0.5">Danger Zone</h3>
          <p className="text-sm text-[var(--color-muted)] font-sans">Irreversible actions that affect the entire platform.</p>
        </div>
      </div>

      <div className="p-8 rounded-3xl border border-red-500/30 bg-red-500/[0.02] space-y-8">
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-red-500 font-sans font-bold">Verification Required</label>
          <input 
            type="text" 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full max-w-md px-6 py-4 rounded-2xl bg-[var(--color-bg)] border border-red-500/20 font-mono text-red-500 focus:outline-none focus:border-red-500 transition-all placeholder:text-red-500/20"
            placeholder="Type CONFIRM to unlock"
          />
          <p className="text-[10px] text-[var(--color-muted)] font-sans">You must type <span className="font-mono text-red-500 font-bold">CONFIRM</span> in all caps to enable the buttons below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Wipe Test Data */}
          <button 
            onClick={() => handleDangerAction('wipe-test-data')}
            disabled={!isConfirmed || !!loadingAction}
            className={`flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border transition-all duration-300 ${isConfirmed ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10 active:scale-95 text-red-500' : 'border-[var(--color-border)] bg-[var(--color-muted)]/5 text-[var(--color-muted)] opacity-50 cursor-not-allowed'} disabled:opacity-50`}
          >
            <div className={`p-4 rounded-full ${isConfirmed ? 'bg-red-500 text-white' : 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]'}`}>
              <Trash2 className={`w-6 h-6 ${loadingAction === 'wipe-test-data' ? 'animate-bounce' : ''}`} />
            </div>
            <div className="text-center">
              <div className="text-sm font-sans font-bold mb-1">{loadingAction === 'wipe-test-data' ? 'Wiping...' : 'Wipe Test Data'}</div>
              <div className="text-[10px] font-sans opacity-60">Deletes all posts & users</div>
            </div>
          </button>

          {/* Force Disconnect */}
          <button 
            onClick={() => handleDangerAction('force-reset')}
            disabled={!isConfirmed || !!loadingAction}
            className={`flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border transition-all duration-300 ${isConfirmed ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10 active:scale-95 text-red-500' : 'border-[var(--color-border)] bg-[var(--color-muted)]/5 text-[var(--color-muted)] opacity-50 cursor-not-allowed'} disabled:opacity-50`}
          >
            <div className={`p-4 rounded-full ${isConfirmed ? 'bg-red-500 text-white' : 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]'}`}>
              <WifiOff className={`w-6 h-6 ${loadingAction === 'force-reset' ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-center">
              <div className="text-sm font-sans font-bold mb-1">{loadingAction === 'force-reset' ? 'Resetting...' : 'Force Reset'}</div>
              <div className="text-[10px] font-sans opacity-60">Disconnect all sockets</div>
            </div>
          </button>

          {/* Clear Redis */}
          <button 
            onClick={() => handleDangerAction('clear-cache')}
            disabled={!isConfirmed || !!loadingAction}
            className={`flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border transition-all duration-300 ${isConfirmed ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/10 active:scale-95 text-red-500' : 'border-[var(--color-border)] bg-[var(--color-muted)]/5 text-[var(--color-muted)] opacity-50 cursor-not-allowed'} disabled:opacity-50`}
          >
            <div className={`p-4 rounded-full ${isConfirmed ? 'bg-red-500 text-white' : 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]'}`}>
              <Database className={`w-6 h-6 ${loadingAction === 'clear-cache' ? 'animate-pulse' : ''}`} />
            </div>
            <div className="text-center">
              <div className="text-sm font-sans font-bold mb-1">{loadingAction === 'clear-cache' ? 'Clearing...' : 'Clear Cache'}</div>
              <div className="text-[10px] font-sans opacity-60">Flush all Redis keys</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
