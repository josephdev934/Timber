"use client";

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

/**
 * ==========================================
 * PAGE: Maintenance
 * ==========================================
 * Displayed when the platform is in maintenance mode.
 * Now dynamic: listens for real-time updates to the maintenance message.
 * ==========================================
 */
export default function MaintenancePage() {
  const { settings } = useSettings();
  
  const displayMessage = settings?.maintenance?.message || "We are currently performing some essential updates to the Timber platform. We'll be back online shortly. Thank you for your patience.";

  return (
    <div className="min-h-screen bg-[#FAF8F6] dark:bg-[#141210] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#775839] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-timber-brand/30">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-bold text-[#2C2420] dark:text-[#F0EBE5] tracking-tight mb-4">
        Scheduled Maintenance
      </h1>
      
      <p className="text-[#8C7B6E] dark:text-[#A08C7A] max-w-md leading-relaxed mb-8">
        {displayMessage}
      </p>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-[#F2EEE9] dark:bg-[#27211C] rounded-full text-xs font-bold text-[#775839] dark:text-[#C4966A] uppercase tracking-widest">
        <span className="w-2 h-2 rounded-full bg-timber-brand animate-pulse"></span>
        Platform is being updated
      </div>
    </div>
  );
}
