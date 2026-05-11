"use client";

import React from 'react';
import { Activity, TrendingUp, Download, Calendar } from 'lucide-react';
import { ActivityLineChart } from '@/components/admin/overview/ActivityLineChart';
import { ContentDonutChart } from '@/components/admin/overview/ContentDonutChart';
import { MessagesBarChart } from '@/components/admin/overview/MessagesBarChart';

export default function AnalyticsPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight">
              Platform Analytics
            </h1>
          </div>
          <p className="text-[var(--color-muted)] font-sans">
            Deep-dive metrics on user engagement, content growth, and system throughput.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all active:scale-95">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-brand)] text-white text-sm font-sans font-bold hover:opacity-90 transition-all active:scale-95">
            <Download className="w-4 h-4" /> Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Engagement Over Time */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold font-sans text-[var(--color-text)] uppercase tracking-widest">Engagement Over Time</h3>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">+12.4% vs last month</span>
          </div>
          <ActivityLineChart />
        </div>

        {/* Messaging Volume */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold font-sans text-[var(--color-text)] uppercase tracking-widest">Messaging Volume</h3>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">+8.2% peak throughput</span>
          </div>
          <MessagesBarChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Distribution */}
        <div className="lg:col-span-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 h-[400px]">
          <h3 className="text-sm font-bold font-sans text-[var(--color-text)] uppercase tracking-widest mb-6">Content Distribution</h3>
          <ContentDonutChart />
        </div>

        {/* Advanced Metrics Placeholder */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 rounded-full bg-[var(--color-elevated)] flex items-center justify-center text-[var(--color-muted)] mb-4">
             <Activity className="w-8 h-8" />
           </div>
           <h4 className="text-lg font-bold font-sans text-[var(--color-text)] mb-2">Detailed Engagement Heatmap</h4>
           <p className="text-sm text-[var(--color-muted)] font-sans max-w-sm mb-6">
             Detailed geographic and temporal heatmaps are currently generating. Check back in a few hours for the full dataset.
           </p>
           <div className="flex gap-2">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="w-12 h-2 rounded-full bg-[var(--color-elevated)] animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
