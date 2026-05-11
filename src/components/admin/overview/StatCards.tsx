"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, Activity, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { socketClient } from '@/infrastructure/socket/socketClient';

/**
 * UTILITY: CountUp Animation Component
 */
const CountUp = ({ end, duration = 1200 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    let frameId: number;
    
    const step = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration]);

  return <>{count.toLocaleString()}</>;
};

export function StatCards() {
  const { token } = useAdmin();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNow, setActiveNow] = useState<number>(0);

  useEffect(() => {
    // 1. Fetch initial stats
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
          setActiveNow(stats.activeNow || 0);
        }
      } catch (err) {
        console.error("[STAT_CARDS_FETCH_FAILED]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // 2. Socket.IO Live Updates
    const socket = socketClient.getInstance();
    
    const handleStatsUpdate = (payload: any) => {
      if (payload.activeConnections !== undefined) {
        setActiveNow(payload.activeConnections);
      }
    };

    socket.on('STATS_UPDATE', handleStatsUpdate);
    socketClient.joinRoom('admin:stats');

    return () => {
      socket.off('STATS_UPDATE', handleStatsUpdate);
      socketClient.leaveRoom('admin:stats');
    };
  }, [token]);

  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { trend: "0%", isPositive: true };
    const diff = ((current - previous) / previous) * 100;
    return {
      trend: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
      isPositive: diff >= 0
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-elevated)]" />
              <div className="w-16 h-6 rounded-full bg-[var(--color-elevated)]" />
            </div>
            <div className="w-24 h-4 rounded bg-[var(--color-elevated)] mb-2" />
            <div className="w-32 h-8 rounded bg-[var(--color-elevated)]" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { 
      title: "Total Users", 
      value: data?.totalUsers || 0, 
      ...calculateTrend(data?.trends?.totalUsers?.current || 0, data?.trends?.totalUsers?.previous || 0),
      icon: Users 
    },
    { 
      title: "Active Now", 
      value: activeNow, 
      trend: "LIVE", 
      isPositive: true,
      icon: Activity 
    },
    { 
      title: "Pending Reports", 
      value: data?.pendingReports || 0, 
      ...calculateTrend(data?.trends?.pendingReports?.current || 0, data?.trends?.pendingReports?.previous || 0),
      icon: ShieldAlert 
    },
    { 
      title: "Media Uploads", 
      value: data?.mediaUploads || 0, 
      ...calculateTrend(data?.trends?.mediaUploads?.current || 0, data?.trends?.mediaUploads?.previous || 0),
      icon: ImageIcon 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((stat, i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-elevated)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <stat.icon className="w-6 h-6 text-[var(--color-text)] opacity-80" />
            </div>
            {stat.trend === 'LIVE' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE
              </span>
            ) : (
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                stat.isPositive 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
              }`}>
                {stat.trend}
              </span>
            )}
          </div>
          <h3 className="text-[var(--color-muted)] font-sans text-sm mb-1">{stat.title}</h3>
          <p className="text-3xl font-bold font-mono text-[var(--color-text)] tracking-tight">
            {stat.trend === 'LIVE' ? activeNow.toLocaleString() : <CountUp end={stat.value} />}
          </p>
        </div>
      ))}
    </div>
  );
}
