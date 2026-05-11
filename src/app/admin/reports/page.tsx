"use client";

import React, { useState } from 'react';
import { ReportsList } from '@/components/admin/reports/ReportsList';
import { ReportDetail } from '@/components/admin/reports/ReportDetail';
import { ShieldAlert, Filter, Wrench } from 'lucide-react';

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-160px)] flex flex-col">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight mb-2">
            Reports & Moderation
          </h1>
          <p className="text-[var(--color-muted)] font-sans">
            Review community flags and enforce safety guidelines.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all active:scale-95">
          <Wrench className="w-4 h-4 text-[var(--color-muted)]" /> Maintenance Mode
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel: Queue */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0">
          <ReportsList 
            selectedId={selectedReportId} 
            onSelect={setSelectedReportId} 
          />
        </div>

        {/* Right Panel: Detail */}
        <div className="flex-1 hidden md:block overflow-hidden">
          <ReportDetail 
            reportId={selectedReportId} 
            onResolve={() => setSelectedReportId(null)}
          />
        </div>
      </div>
    </div>
  );
}
