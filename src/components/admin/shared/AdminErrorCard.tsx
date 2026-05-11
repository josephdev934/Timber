import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export interface AdminErrorCardProps {
  error: Error;
  reset: () => void;
}

export function AdminErrorCard({ error, reset }: AdminErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertOctagon className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-2">
        Something went wrong
      </h3>
      <div className="font-mono text-sm text-[var(--color-muted)] max-w-md mx-auto mb-6 p-4 bg-[var(--color-elevated)] rounded-2xl break-words">
        {error.message || "An unknown error occurred"}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-brand)] text-white font-sans text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-300"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}
