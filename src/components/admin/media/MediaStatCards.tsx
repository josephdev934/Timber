import React, { useState, useEffect } from 'react';
import { HardDrive, Zap } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

export function MediaStatCards() {
  const { token } = useAdmin();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/media/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setData)
    .catch(err => console.error("[MEDIA_STATS_FAILED]", err));
  }, [token]);

  const stats = [
    { 
      title: "Storage Used", 
      value: data?.storage?.used_human || "0 GB", 
      limit: data?.storage?.limit_human || "500 GB",
      percent: data?.storage?.percent || 0,
      icon: HardDrive,
      color: "brand"
    },
    { 
      title: "Bandwidth Used", 
      value: data?.bandwidth?.used_human || "0 GB", 
      limit: data?.bandwidth?.limit_human || "10 TB",
      percent: data?.bandwidth?.percent || 0,
      icon: Zap,
      color: "amber"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-[var(--color-surface)] rounded-3xl p-8 border border-[var(--color-border)] shadow-sm animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl bg-[var(--color-elevated)] flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color === 'brand' ? 'text-[var(--color-brand)]' : 'text-amber-500'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-sans text-[var(--color-text)]">{stat.title}</h3>
              {data?.storage?.limit === 1 ? (
                <p className="text-[10px] font-sans text-red-500 font-bold uppercase tracking-tight">API Keys Missing in .env</p>
              ) : (
                <p className="text-xs font-sans text-[var(--color-muted)]">
                  {data?.storage?.totalAssets || 0} Assets on Platform
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-3">
            <p className="text-3xl font-bold font-mono text-[var(--color-text)] tracking-tight">
              {stat.value}
            </p>
            <p className="text-xs font-mono text-[var(--color-muted)]">
              of {stat.limit}
            </p>
          </div>

          <div className="w-full h-2 rounded-full bg-[var(--color-elevated)] overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                stat.color === 'brand' ? 'bg-[var(--color-brand)]' : 'bg-amber-500'
              }`} 
              style={{ width: `${stat.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
