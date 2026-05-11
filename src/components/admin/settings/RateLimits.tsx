"use client";

import React, { useState } from 'react';
import { Zap, Save } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';

export function RateLimits({ initialData, onUpdate }: { initialData?: any, onUpdate?: () => void }) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  const [limits, setLimits] = useState({
    messagesPerMinute: initialData?.messagesPerMinute || 60,
    uploadsPerDay: initialData?.uploadsPerDay || 50,
    reportsPerHour: initialData?.reportsPerHour || 10
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/rate-limits', {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(limits)
      });
      if (res.ok) {
        addToast({ message: "Rate limits updated successfully", type: 'success' });
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      addToast({ message: "Failed to update rate limits", type: 'error' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-1">Rate Limiting</h3>
        <p className="text-sm text-[var(--color-muted)] font-sans">Control platform usage to prevent abuse and manage costs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages per Minute */}
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold">Messages / Min</label>
          <div className="relative">
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input 
              type="number" 
              value={limits.messagesPerMinute}
              onChange={(e) => setLimits({ ...limits, messagesPerMinute: parseInt(e.target.value) || 0 })}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            />
          </div>
          <p className="text-[10px] text-[var(--color-muted)] font-sans italic">Per user socket connection.</p>
        </div>

        {/* Uploads per Day */}
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold">Uploads / Day</label>
          <input 
            type="number" 
            value={limits.uploadsPerDay}
            onChange={(e) => setLimits({ ...limits, uploadsPerDay: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
          <p className="text-[10px] text-[var(--color-muted)] font-sans italic">Total media files per user.</p>
        </div>

        {/* Reports per Hour */}
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold">Reports / Hour</label>
          <input 
            type="number" 
            value={limits.reportsPerHour}
            onChange={(e) => setLimits({ ...limits, reportsPerHour: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          />
          <p className="text-[10px] text-[var(--color-muted)] font-sans italic">Prevents spam moderation requests.</p>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--color-brand)] text-white font-sans font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--color-brand)]/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Limits'}
        </button>
      </div>
    </div>
  );
}
