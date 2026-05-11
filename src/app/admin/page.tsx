"use client";

import React from 'react';
import { StatCards } from '@/components/admin/overview/StatCards';
import { ActivityLineChart } from '@/components/admin/overview/ActivityLineChart';
import { ContentDonutChart } from '@/components/admin/overview/ContentDonutChart';
import { MessagesBarChart } from '@/components/admin/overview/MessagesBarChart';
import { LiveActivityFeed } from '@/components/admin/overview/LiveActivityFeed';

export default function OverviewPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight mb-2">
          Overview Dashboard
        </h1>
        <p className="text-[var(--color-muted)] font-sans">
          Real-time system health and user engagement metrics.
        </p>
      </div>

      <StatCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ActivityLineChart />
        <ContentDonutChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MessagesBarChart />
        <LiveActivityFeed />
      </div>
    </div>
  );
}
