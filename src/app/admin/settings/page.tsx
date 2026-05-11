"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Globe, ShieldCheck, Zap, Power, ShieldAlert } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
import { FeatureToggles } from '@/components/admin/settings/FeatureToggles';
import { RateLimits } from '@/components/admin/settings/RateLimits';
import { MaintenanceMode } from '@/components/admin/settings/MaintenanceMode';
import { DangerZone } from '@/components/admin/settings/DangerZone';

export default function SettingsPage() {
  const { token, settings, loading, refreshSettings } = useAdmin();
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'limits' | 'maintenance' | 'danger'>('general');

  const handleUpdate = async () => {
    await refreshSettings();
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'features', label: 'Features', icon: ShieldCheck },
    { id: 'limits', label: 'Rate Limits', icon: Zap },
    { id: 'maintenance', label: 'Maintenance', icon: Power },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, danger: true },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center text-white">
            <Settings className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight">
            System Settings
          </h1>
        </div>
        <p className="text-[var(--color-muted)] font-sans">
          Configure platform behavior, security protocols, and infrastructure toggles.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-sans text-sm font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? tab.danger 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                      : 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand)]/20' 
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 min-h-[600px] shadow-sm relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/50 backdrop-blur-sm z-10 rounded-3xl">
              <div className="w-10 h-10 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeTab === 'general' && <GeneralSettings initialData={settings?.general} onUpdate={handleUpdate} />}
              {activeTab === 'features' && <FeatureToggles initialData={settings?.features} onUpdate={handleUpdate} />}
              {activeTab === 'limits' && <RateLimits initialData={settings?.rateLimits} onUpdate={handleUpdate} />}
              {activeTab === 'maintenance' && <MaintenanceMode initialData={settings?.maintenance} onUpdate={handleUpdate} />}
              {activeTab === 'danger' && <DangerZone onUpdate={handleUpdate} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
