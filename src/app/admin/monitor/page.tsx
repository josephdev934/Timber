"use client";

import React from 'react';
import { MonitorStatCards } from '@/components/admin/monitor/MonitorStatCards';
import { ActiveRoomsTable } from '@/components/admin/monitor/ActiveRoomsTable';
import { LiveEventLog } from '@/components/admin/monitor/LiveEventLog';
import { RedisPanel } from '@/components/admin/monitor/RedisPanel';
import { Activity } from 'lucide-react';

export default function MonitorPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center text-white">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight">
            Real-Time Monitor
          </h1>
        </div>
        <p className="text-[var(--color-muted)] font-sans">
          Live infrastructure throughput and socket orchestration dashboard.
        </p>
      </div>

      <MonitorStatCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Col: Rooms & Events */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveRoomsTable />
          <LiveEventLog />
        </div>

        {/* Right Col: Redis Stats */}
        <div className="lg:col-span-1">
          <RedisPanel />
        </div>
      </div>
    </div>
  );
}
