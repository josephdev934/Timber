"use client";

import React, { useState } from 'react';
import { MediaStatCards } from '@/components/admin/media/MediaStatCards';
import { MediaGrid } from '@/components/admin/media/MediaGrid';
import { MediaFilterBar } from '@/components/admin/media/MediaFilterBar';
import { MediaPreviewModal } from '@/components/admin/media/MediaPreviewModal';
import { ImageIcon } from 'lucide-react';

export default function MediaLibraryPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    dateRange: 'all'
  });
  const [pagination, setPagination] = useState<any>({
    total: 0,
    page: 1,
    limit: 24,
    totalPages: 1
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const handlePreview = (item: any) => {
    setSelectedItem(item);
    setIsPreviewOpen(true);
  };

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-brand)] flex items-center justify-center text-white">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight">
            Media Library
          </h1>
        </div>
        <p className="text-[var(--color-muted)] font-sans">
          Centralized management for all platform uploads and Cloudinary assets.
        </p>
      </div>

      <MediaStatCards />
      
      <div className="bg-[var(--color-surface)] rounded-3xl p-8 border border-[var(--color-border)] min-h-[600px]">
        <MediaFilterBar filters={filters} setFilters={setFilters} />
        <MediaGrid 
          filters={filters} 
          onPreview={handlePreview} 
          onDataLoad={setPagination}
          refreshKey={refreshKey}
        />
        
        {/* Pagination */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
           <p className="text-xs font-sans text-[var(--color-muted)]">
             Showing <span className="font-mono text-[var(--color-text)] font-bold">
               {Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)}-{Math.min(pagination.total, pagination.page * pagination.limit)}
             </span> of <span className="font-mono text-[var(--color-text)] font-bold">
               {pagination.total.toLocaleString()}
             </span> assets
           </p>
           {pagination.page < pagination.totalPages && (
             <button className="px-8 py-3 rounded-full border border-[var(--color-border)] text-sm font-sans font-bold text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all active:scale-95">
               Load More Assets
             </button>
           )}
        </div>
      </div>

      <MediaPreviewModal 
        item={selectedItem} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        onUpdate={handleUpdate}
      />
    </div>
  );
}
