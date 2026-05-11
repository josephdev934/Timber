"use client";

import React, { useEffect } from 'react';
import { useToast, ToastMessage } from './useToast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export function AdminToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return { border: 'border-l-[var(--color-brand)]', icon: <CheckCircle2 className="w-5 h-5 text-[var(--color-brand)]" /> };
      case 'error':
        return { border: 'border-l-red-500', icon: <AlertCircle className="w-5 h-5 text-red-500" /> };
      case 'warning':
        return { border: 'border-l-amber-500', icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> };
      default:
        return { border: 'border-l-[var(--color-text)]', icon: <Info className="w-5 h-5 text-[var(--color-text)]" /> };
    }
  };

  const styles = getStyles();

  return (
    <div className={`pointer-events-auto bg-[var(--color-surface)] border border-[var(--color-border)] border-l-4 ${styles.border} rounded-xl shadow-lg p-4 flex items-start gap-3 w-80 animate-in slide-in-from-right-8 fade-in duration-300`}>
      <div className="flex-shrink-0 mt-0.5">
        {styles.icon}
      </div>
      <div className="flex-1 font-sans text-sm text-[var(--color-text)]">
        {toast.message}
      </div>
      <button 
        onClick={onRemove}
        className="flex-shrink-0 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
