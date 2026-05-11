"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useAdmin } from '@/context/AdminContext';

export function MessagesBarChart() {
  const { token } = useAdmin();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/analytics/messages?range=7d', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const rawData = await res.json();
          // Format date for chart (e.g., 2026-05-10 -> Sun)
          const formatted = rawData.map((item: any) => ({
            ...item,
            name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
          }));
          setData(formatted);
        }
      } catch (err) {
        console.error("[MESSAGES_CHART_FETCH_FAILED]", err);
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
          <div className="h-6 w-48 bg-[var(--color-elevated)] animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-[var(--color-elevated)] animate-pulse rounded" />
        </div>
        <div className="flex-1 bg-[var(--color-elevated)]/30 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm col-span-1 lg:col-span-2 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold font-sans text-[var(--color-text)]">Message Volume</h3>
          <p className="text-sm font-sans text-[var(--color-muted)]">Sent messages over the last 7 days</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="name" 
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
                cursor={{ fill: 'var(--color-elevated)', opacity: 0.4 }}
                itemStyle={{ color: 'var(--color-brand)', fontWeight: 'bold' }}
                labelStyle={{ color: 'var(--color-muted)', marginBottom: '4px' }}
              />
              <Bar 
                dataKey="count" 
                fill="var(--color-brand)" 
                radius={[4, 4, 0, 0]}
                barSize={32}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === data.length - 1 ? 'var(--color-brand)' : 'var(--color-brand)'} 
                    fillOpacity={0.6 + (index / data.length) * 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--color-muted)] font-sans italic">
            No message activity data available
          </div>
        )}
      </div>
    </div>
  );
}
