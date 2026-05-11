import React, { useState, useEffect } from 'react';
import { Activity, Layout, Database } from 'lucide-react';
import { socketClient } from '@/infrastructure/socket/socketClient';
import { useAdmin } from '@/context/AdminContext';

export function MonitorStatCards() {
  const { token } = useAdmin();
  const [liveStats, setLiveStats] = useState({
    sockets: 0,
    rooms: 0,
    redisHitRate: 0,
    startTime: Date.now()
  });

  useEffect(() => {
    if (!token) return;

    const socket = socketClient.getInstance();
    
    const handleConnect = () => {
      socketClient.joinRoom('admin:stats');
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const handleStats = (data: any) => {
      const payload = data.payload || data;
      setLiveStats(prev => ({
        ...prev,
        ...payload
      }));
    };

    socket.on('STATS_UPDATE', handleStats);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('STATS_UPDATE', handleStats);
      socketClient.leaveRoom('admin:stats');
    };
  }, [token]);

  const stats = [
    {
      title: "Active Connections",
      value: liveStats.sockets.toLocaleString(),
      trend: "Real-time",
      icon: Activity,
      color: "emerald"
    },
    {
      title: "Active Rooms",
      value: liveStats.rooms.toLocaleString(),
      trend: "Socket.IO",
      icon: Layout,
      color: "brand"
    },
    {
      title: "Redis Hit Rate",
      value: `${liveStats.redisHitRate || 0}%`,
      trend: "Performance",
      icon: Database,
      color: "amber"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          <div className={`w-12 h-12 rounded-full bg-[var(--color-elevated)] flex items-center justify-center mb-4`}>
             <stat.icon className="w-6 h-6 text-[var(--color-text)] opacity-70" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans mb-1">
            {stat.title}
          </h3>
          <p className="text-4xl font-bold font-mono text-[var(--color-text)] mb-2">
            {stat.value}
          </p>
          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
            stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
            stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
            'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
          }`}>
            {stat.trend}
          </span>
        </div>
      ))}
    </div>
  );
}
