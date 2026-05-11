"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAdmin } from '@/context/AdminContext';

export function ContentDonutChart() {
  const { token } = useAdmin();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/analytics/content-breakdown', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const rawData = await res.json();
          setData(rawData);
        }
      } catch (err) {
        console.error("[CONTENT_CHART_FETCH_FAILED]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm h-[400px] flex flex-col">
        <div className="mb-6">
          <div className="h-6 w-32 bg-[var(--color-elevated)] animate-pulse rounded mb-2" />
          <div className="h-4 w-48 bg-[var(--color-elevated)] animate-pulse rounded" />
        </div>
        <div className="flex-1 bg-[var(--color-elevated)]/30 animate-pulse rounded-full w-48 h-48 mx-auto" />
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm h-[400px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)]">Content Mix</h3>
        <p className="text-sm font-sans text-[var(--color-muted)]">Distribution by type</p>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-[var(--color-text)]">
            {total.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold font-sans text-[var(--color-muted)] uppercase tracking-widest">
            Total Items
          </span>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface)', 
                borderColor: 'var(--color-border)',
                borderRadius: '16px',
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
              itemStyle={{ fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-[10px] font-bold font-sans text-[var(--color-muted)] uppercase truncate">
                {item.name}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--color-text)]">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
