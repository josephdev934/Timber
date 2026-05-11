"use client";

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';

interface FeatureItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function FeatureToggles({ initialData, onUpdate }: { initialData?: any, onUpdate?: () => void }) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  const [features, setFeatures] = useState<FeatureItem[]>([
    { id: 'mediaUploads', label: 'Media Uploads', description: 'Allow users to upload images and videos to posts.', enabled: initialData?.mediaUploads ?? true },
    { id: 'groupCreation', label: 'Group Creation', description: 'Enable users to create and manage their own communities.', enabled: initialData?.groupCreation ?? true },
    { id: 'publicFeed', label: 'Public Feed', description: 'Show global activity feed to non-registered users.', enabled: initialData?.publicFeed ?? false },
    { id: 'mentions', label: '@Mentions', description: 'Allow users to tag each other in comments and posts.', enabled: initialData?.mentions ?? true },
    { id: 'notifications', label: 'Push Notifications', description: 'Dispatch real-time browser and mobile notifications.', enabled: initialData?.notifications ?? true }
  ]);

  const toggleFeature = async (id: string) => {
    const feature = features.find(f => f.id === id);
    if (!feature) return;

    const newEnabled = !feature.enabled;
    setFeatures(features.map(f => f.id === id ? { ...f, enabled: newEnabled } : f));

    try {
      const res = await fetch('/api/admin/settings/features', {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [id]: newEnabled })
      });
      if (res.ok) {
        addToast({ message: `${feature.label} toggled ${newEnabled ? 'ON' : 'OFF'}`, type: 'success' });
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      addToast({ message: `Failed to toggle ${feature.label}`, type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-1">Feature Toggles</h3>
        <p className="text-sm text-[var(--color-muted)] font-sans">Enable or disable core platform capabilities instantly.</p>
      </div>

      <div className="space-y-4">
        {features.map((feature) => (
          <div 
            key={feature.id}
            className="flex items-center justify-between p-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 hover:bg-[var(--color-elevated)] transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-xl ${feature.enabled ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-sans font-bold text-[var(--color-text)]">{feature.label}</div>
                <div className="text-xs text-[var(--color-muted)] font-sans max-w-md">{feature.description}</div>
              </div>
            </div>

            <button 
              onClick={() => toggleFeature(feature.id)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${feature.enabled ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-muted)]/30'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${feature.enabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
