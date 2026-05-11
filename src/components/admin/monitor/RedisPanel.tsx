import React, { useState, useEffect, useCallback } from 'react';
import { Database, Trash2, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

export function RedisPanel() {
  const { token } = useAdmin();
  const [stats, setStats] = useState({
    usedMemory: '0B',
    maxMemory: '8GB',
    usagePercent: 0
  });
  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [statsRes, keysRes] = await Promise.all([
        fetch('/api/admin/redis/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/redis/keys', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          usedMemory: statsData.used_memory_human || '0B',
          maxMemory: statsData.maxmemory_human || '8GB',
          usagePercent: statsData.usage_percent || 0
        });
      }

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setKeys(keysData.map((k: any) => ({
          name: k.key,
          ttl: k.ttl,
          size: k.size || 'N/A'
        })));
      }
    } catch (err) {
      console.error("[REDIS_FETCH_FAILED]", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const invalidateKey = async (key: string) => {
    if (!confirm(`Are you sure you want to invalidate key: ${key}?`)) return;
    try {
      const res = await fetch(`/api/admin/redis/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("[REDIS_INVALIDATE_FAILED]", err);
    }
  };

  const invalidateAll = async () => {
    if (!confirm("CRITICAL: Are you sure you want to invalidate THE ENTIRE CACHE? This will impact performance temporarily.")) return;
    try {
      const res = await fetch('/api/admin/redis/keys/all', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("[REDIS_FLUSH_FAILED]", err);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] p-8 h-full flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-sans text-[var(--color-text)]">Redis Cluster</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">ACTIVE</span>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchData}
          disabled={isLoading}
          className={`p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)] transition-all ${isLoading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Memory Usage */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">MEMORY USAGE</span>
          <span className="text-xs font-mono font-bold text-[var(--color-text)]">
            {stats.usedMemory} / {stats.maxMemory}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-[var(--color-elevated)] overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000" 
            style={{ width: `${stats.usagePercent}%` }}
          />
        </div>
      </div>

      {/* Keys Table */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans border-b border-[var(--color-border)] pb-2 px-2 sticky top-0 bg-[var(--color-surface)] z-10">
          <span>KEY_ID</span>
          <span className="text-center">TTL</span>
          <span className="text-right">ACTION</span>
        </div>
        <div className="space-y-1">
          {keys.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-muted)] italic">
              No keys currently indexed in cache
            </div>
          ) : (
            keys.map((k) => (
              <div key={k.name} className="grid grid-cols-3 items-center p-2 rounded-xl hover:bg-[var(--color-elevated)] transition-colors group">
                <span className="text-xs font-mono text-[var(--color-text)] truncate" title={k.name}>{k.name}</span>
                <span className="text-[10px] font-mono text-[var(--color-muted)] text-center">
                  {k.ttl === -1 ? '∞' : `${k.ttl}s`}
                </span>
                <div className="flex justify-end">
                  <button 
                    onClick={() => invalidateKey(k.name)}
                    className="p-1.5 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <button 
          onClick={invalidateAll}
          className="w-full py-3 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
           <Trash2 className="w-4 h-4" /> Invalidate All Cache
        </button>
      </div>
    </div>
  );
}
