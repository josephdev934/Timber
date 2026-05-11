"use client";

import React, { useState } from 'react';
import { AlertTriangle, Power } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';

export function MaintenanceMode({ initialData, onUpdate }: { initialData?: any, onUpdate?: () => void }) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  const [isEnabled, setIsEnabled] = useState(initialData?.enabled || false);
  const [message, setMessage] = useState(initialData?.message || "Timber is currently undergoing scheduled maintenance. We'll be back shortly!");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/maintenance', {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: isEnabled, message })
      });
      if (res.ok) {
        addToast({ message: "Maintenance mode updated successfully", type: 'success' });
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      addToast({ message: "Failed to update maintenance mode", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-1">Maintenance Mode</h3>
        <p className="text-sm text-[var(--color-muted)] font-sans">Temporarily disable platform access for all non-admin users.</p>
      </div>

      <div className={`p-6 rounded-3xl border transition-all duration-300 ${isEnabled ? 'bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/5' : 'bg-[var(--color-bg)]/50 border-[var(--color-border)]'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isEnabled ? 'bg-red-500 text-white' : 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]'}`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-sans font-bold text-[var(--color-text)]">Status Indicator</div>
              <div className="text-xs font-mono uppercase tracking-widest font-bold">
                {isEnabled ? (
                  <span className="text-red-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE: MAINTENANCE_ACTIVE
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    IDLE: SYSTEM_OPERATIONAL
                  </span>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              if (!isEnabled && !message.trim()) {
                addToast({ message: 'Add a maintenance message before enabling.', type: 'error' });
                return;
              }
              setIsEnabled(!isEnabled);
            }}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${isEnabled ? 'bg-red-500' : 'bg-[var(--color-muted)]/30'}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${isEnabled ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <label className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold">Maintenance Message</label>
             {!isEnabled && <span className="text-[10px] text-amber-500 font-sans italic flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Toggle on to edit</span>}
          </div>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!isEnabled}
            className={`w-full p-6 rounded-2xl font-sans text-sm focus:outline-none transition-all duration-300 min-h-[120px] ${isEnabled ? 'bg-[var(--color-bg)] border-red-500/30 border text-[var(--color-text)] focus:border-red-500' : 'bg-[var(--color-bg)]/50 border-[var(--color-border)] border text-[var(--color-muted)] opacity-50'}`}
            placeholder="Enter public maintenance message..."
          />
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`px-10 py-3 rounded-full font-sans font-bold transition-all active:scale-95 shadow-lg ${isEnabled ? 'bg-red-500 text-white hover:opacity-90 shadow-red-500/20' : 'bg-[var(--color-brand)] text-white hover:opacity-90 shadow-[var(--color-brand)]/20'} disabled:opacity-50`}
          >
            {saving ? 'Pushing Updates...' : isEnabled ? (initialData?.enabled ? 'Update Maintenance Message' : 'Enable Maintenance Mode') : 'Disable Maintenance Mode'}
          </button>
        </div>
      </div>
    </div>
  );
}
