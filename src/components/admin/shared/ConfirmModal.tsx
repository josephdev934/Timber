"use client";

import React, { useState, useEffect } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  requireTypedConfirm?: boolean;
  confirmWord?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  requireTypedConfirm = false,
  confirmWord = "CONFIRM",
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTypedValue("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isConfirmDisabled = isLoading || (requireTypedConfirm && typedValue !== confirmWord);

  const getButtonColor = () => {
    switch (variant) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white';
      default: return 'bg-[var(--color-brand)] hover:opacity-90 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
        onClick={() => !isLoading && onCancel()}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-xl font-bold font-sans text-[var(--color-text)] mb-2">
          {title}
        </h2>
        <p className="text-[var(--color-muted)] font-sans text-sm mb-6">
          {description}
        </p>

        {requireTypedConfirm && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-sans mb-2">
              Type <span className="font-mono text-[var(--color-text)] font-bold">{confirmWord}</span> to verify
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              placeholder={confirmWord}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-full font-sans text-sm font-medium text-[var(--color-text)] bg-[var(--color-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-bg)] active:scale-95 transition-all duration-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`px-6 py-2.5 rounded-full font-sans text-sm font-medium active:scale-95 transition-all duration-300 flex items-center gap-2 ${getButtonColor()} disabled:opacity-50 disabled:active:scale-100`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {requireTypedConfirm ? confirmWord : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
