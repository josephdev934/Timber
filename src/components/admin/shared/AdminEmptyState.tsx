import React from 'react';
import { PackageOpen } from 'lucide-react'; // Fallback icon instead of full SVG for now

export interface AdminEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function AdminEmptyState({ title, description, actionLabel, onAction, icon }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
      <div className="w-20 h-20 mb-6 text-[var(--color-muted)] opacity-50">
        {icon || <PackageOpen className="w-full h-full" strokeWidth={1} />}
      </div>
      <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--color-muted)] font-sans text-sm max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-full bg-[var(--color-brand)] text-white font-sans text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
