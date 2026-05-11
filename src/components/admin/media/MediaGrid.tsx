import React, { useState, useEffect } from 'react';
import { MoreVertical, User, Calendar, Database, Eye, Flag, Trash2, Video } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

export function MediaGrid({ 
  filters, 
  onPreview,
  onDataLoad,
  refreshKey = 0
}: { 
  filters: any, 
  onPreview?: (item: any) => void,
  onDataLoad?: (pagination: any) => void,
  refreshKey?: number
}) {
  const { token } = useAdmin();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          type: filters.type,
          search: filters.search,
          dateRange: filters.dateRange
        });
        
        const res = await fetch(`/api/admin/media?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMediaItems(data.media || []);
          if (onDataLoad) onDataLoad(data.pagination);
        }
      } catch (err) {
        console.error("[MEDIA_FETCH_FAILED]", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchMedia, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [token, filters, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this media?")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMediaItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("[MEDIA_DELETE_FAILED]", err);
    }
  };

  if (isLoading && mediaItems.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-[var(--color-elevated)]" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-[var(--color-elevated)] rounded w-3/4" />
              <div className="h-3 bg-[var(--color-elevated)] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 text-[var(--color-muted)]">
        <Database className="w-16 h-16 opacity-10" />
        <p className="text-lg font-sans font-bold">No media assets found</p>
        <p className="text-sm">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {mediaItems.map((item) => {
        const uploaderName = item.uploaderId?.name || item.uploaderId?.username || 'Unknown';
        const fileSizeHuman = item.size 
          ? (item.size / (1024 * 1024)).toFixed(2) + ' MB' 
          : item.source === 'Media' ? 'N/A' : 'Auto';
        
        return (
          <div 
            key={item.id || item._id} 
            className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square bg-[var(--color-elevated)] overflow-hidden">
              {item.url ? (
                item.type === 'video' ? (
                  <video 
                    src={item.url} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    muted
                    loop
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10">
                  <Database className="w-16 h-16" />
                </div>
              )}
              
              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <div className="flex gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                    {item.type}
                  </span>
                  {item.source && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/40 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                      {item.source}
                    </span>
                  )}
                </div>
                {item.isFlagged && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-white uppercase tracking-widest shadow-lg shadow-amber-500/20">
                    FLAGGED
                  </span>
                )}
              </div>

              {/* Hover Actions Bar */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                 <button 
                   onClick={() => {
                     const normalizedItem = {
                       ...item,
                       id: item._id || item.id,
                       uploaderName,
                       fileSizeHuman,
                       createdAt: item.createdAt
                     };
                     onPreview?.(normalizedItem);
                   }}
                   className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                 >
                   <Eye className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => handleDelete(item._id || item.id)}
                   className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden">
                   {item.uploaderId?.profilePhoto ? (
                     <img src={item.uploaderId.profilePhoto} className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-3 h-3 text-[var(--color-muted)]" />
                   )}
                </div>
                <span className="text-xs font-sans font-bold text-[var(--color-text)] truncate">{uploaderName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--color-muted)] flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-mono text-[var(--color-muted)] font-bold px-1.5 py-0.5 bg-[var(--color-elevated)] rounded">
                  {fileSizeHuman}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
