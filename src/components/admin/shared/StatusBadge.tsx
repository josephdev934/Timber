import React from 'react';

export type BadgeStatus = 'active' | 'banned' | 'flagged' | 'pending' | 'delivered' | 'failed' | 'archived' | 'system' | 'resolved' | 'dismissed';

export interface StatusBadgeProps {
  status: BadgeStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = (s: string) => {
    const normalized = s.toLowerCase();
    switch (normalized) {
      case 'active':
      case 'delivered':
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'banned':
      case 'failed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'flagged':
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'archived':
      case 'dismissed':
        return 'bg-[var(--color-elevated)] text-[var(--color-muted)] border border-[var(--color-border)]';
      case 'system':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      default:
        // Default brand styling
        return 'bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20';
    }
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans ${getStatusStyles(status)} ${className}`}>
      {label}
    </span>
  );
}
