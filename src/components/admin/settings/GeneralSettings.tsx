"use client";

import React, { useState } from 'react';
import { Upload, Globe, Save } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';

export function GeneralSettings({ initialData, onUpdate }: { initialData?: any, onUpdate?: () => void }) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    platformName: initialData?.platformName || 'Timber',
    supportEmail: initialData?.supportEmail || 'support@timber.io'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/general', {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast({ message: "General settings updated", type: 'success' });
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      addToast({ message: "Failed to update settings", type: 'error' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-1">General Configuration</h3>
        <p className="text-sm text-[var(--color-muted)] font-sans">Update platform identity and global branding.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Platform Name */}
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold">Platform Name</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
            <input 
              type="text" 
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] font-sans text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              placeholder="Enter platform name"
            />
          </div>
          <p className="text-[10px] text-[var(--color-muted)] font-sans italic">This appears in browser tabs and emails.</p>
        </div>

        {/* Support Email */}
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold">Support Email</label>
          <input 
            type="email" 
            value={formData.supportEmail}
            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] font-sans text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
            placeholder="Enter support email"
          />
        </div>
      </div>

      {/* Logo Upload */}
      <div className="space-y-3">
        <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold">Platform Logo</label>
        <div className="border-2 border-dashed border-[var(--color-brand)]/30 rounded-3xl p-12 flex flex-col items-center justify-center bg-[var(--color-brand)]/5 hover:bg-[var(--color-brand)]/10 transition-colors cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center text-[var(--color-brand)] mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-sm font-sans font-bold text-[var(--color-text)] mb-1">Click to upload new logo</div>
          <div className="text-xs text-[var(--color-muted)] font-sans">SVG, PNG or JPG (max. 800x400px)</div>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--color-brand)] text-white font-sans font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--color-brand)]/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save General Changes'}
        </button>
      </div>
    </div>
  );
}
