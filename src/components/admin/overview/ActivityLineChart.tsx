"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAdmin } from '@/context/AdminContext';

export function ActivityLineChart() {
  const { token } = useAdmin();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/analytics/activity?range=30d', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const rawData = await res.json();
          // Format date for chart (e.g., 2026-05-10 -> 10 May)
          const formatted = rawData.map((item: any) => {
            const date = new Date(item.date);
            return {
              ...item,
              date: isNaN(date.getTime()) 
                ? item.date 
                : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            };
          });
          setData(formatted);
        }
      } catch (err) {
        console.error("[ACTIVITY_CHART_FETCH_FAILED]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm col-span-1 lg:col-span-2 h-[400px] flex flex-col">
        <div className="mb-6">
          <div className="h-6 w-32 bg-[var(--color-elevated)] animate-pulse rounded mb-2" />
          <div className="h-4 w-48 bg-[var(--color-elevated)] animate-pulse rounded" />
        </div>
        <div className="flex-1 bg-[var(--color-elevated)]/30 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm col-span-1 lg:col-span-2 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold font-sans text-[var(--color-text)]">User Activity</h3>
          <p className="text-sm font-sans text-[var(--color-muted)]">Post volume over the last 30 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-sans text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand)]"></div>
            Post Activity
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-border)',
                  borderRadius: '16px',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: 'var(--color-brand)', fontWeight: 'bold' }}
                labelStyle={{ color: 'var(--color-muted)', marginBottom: '4px' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="var(--color-brand)" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: 'var(--color-brand)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--color-muted)] font-sans italic">
            No activity data recorded in this period
          </div>
        )}
      </div>
    </div>
  );
}
