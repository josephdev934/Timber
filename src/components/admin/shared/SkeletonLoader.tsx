import React from 'react';

export interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className = '' }: SkeletonLoaderProps) {
  return (
    <div 
      className={`animate-pulse rounded-2xl bg-[var(--color-elevated)] opacity-60 ${className}`}
    />
  );
}
