import React, { useEffect, useState } from 'react';
import { X, User, Calendar, Database, Eye, Flag, Trash2, ExternalLink } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

interface MediaItem {
  id: string;
  type: string;
  url: string;
  uploaderName: string;
  uploaderAvatar?: string;
  uploaderId?: string;
  createdAt: string;
  fileSizeHuman: string;
  isFlagged: boolean;
  cloudinaryId?: string;
  originalContentId?: string;
  originalContentType?: string;
}

interface MediaPreviewModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function MediaPreviewModal({ item, isOpen, onClose, onUpdate }: MediaPreviewModalProps) {
  const { token } = useAdmin();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleToggleFlag = async () => {
    setIsFlagging(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}/flag`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error("[MEDIA_FLAG_FAILED]", err);
    } finally {
      setIsFlagging(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this media?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onClose();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error("[MEDIA_DELETE_FAILED]", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-6xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row h-full max-h-[90vh]">
        
        {/* Close Button Mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors md:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Preview Area */}
        <div className="flex-1 bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden group">
          {item.type === 'video' ? (
            <video 
              src={item.url} 
              controls 
              className="max-w-full max-h-full"
              autoPlay
            />
          ) : (
            <img 
              src={item.url} 
              alt="Media Preview" 
              className="max-w-full max-h-full object-contain" 
            />
          )}

          {/* Type Badge */}
          <div className="absolute top-6 left-6">
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
              {item.type}
            </span>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="w-full md:w-[380px] flex flex-col bg-[var(--color-surface)] border-l border-[var(--color-border)]">
          {/* Header */}
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-elevated)]/20">
            <h2 className="text-xl font-bold font-sans text-[var(--color-text)]">Media Detail</h2>
            <button 
              onClick={onClose}
              className="hidden md:flex p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
            {/* Uploader */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold mb-3">Uploader</label>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <div className="w-10 h-10 rounded-full bg-[var(--color-elevated)] flex items-center justify-center border border-[var(--color-border)] overflow-hidden">
                  {item.uploaderAvatar ? (
                    <img src={item.uploaderAvatar} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[var(--color-muted)]" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-sans font-bold text-[var(--color-text)]">{item.uploaderName}</div>
                  <div className="text-[10px] font-mono text-[var(--color-muted)]">ID: {(typeof item.uploaderId === 'object' ? (item.uploaderId as any)?._id : item.uploaderId) || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold mb-2">Upload Date</label>
                <div className="flex items-center gap-2 text-sm font-mono text-[var(--color-text)]">
                  <Calendar className="w-4 h-4 text-[var(--color-muted)]" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold mb-2">File Size</label>
                <div className="flex items-center gap-2 text-sm font-mono text-[var(--color-text)]">
                  <Database className="w-4 h-4 text-[var(--color-muted)]" />
                  {item.fileSizeHuman}
                </div>
              </div>
            </div>

            {/* Technical Detail */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold mb-2">Cloudinary Asset ID</label>
              <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] font-mono text-[10px] text-[var(--color-muted)] break-all">
                {item.cloudinaryId || 'Direct Upload / Unknown'}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-sans font-bold mb-2">Moderation Status</label>
              {item.isFlagged ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-sans font-bold uppercase tracking-wide">
                  <Flag className="w-3.5 h-3.5" /> Flagged for Review
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-sans font-bold uppercase tracking-wide">
                  <Eye className="w-3.5 h-3.5" /> Publicly Visible
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg)]/50 grid grid-cols-2 gap-3">
            <button 
              onClick={handleToggleFlag}
              disabled={isFlagging}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full text-white text-xs font-sans font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-50 ${
                item.isFlagged ? 'bg-slate-600 shadow-slate-500/20' : 'bg-amber-500 shadow-amber-500/20'
              }`}
            >
              <Flag className="w-4 h-4" /> 
              {isFlagging ? 'Processing...' : item.isFlagged ? 'Unflag Media' : 'Flag Media'}
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-red-500 text-white text-xs font-sans font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : <><Trash2 className="w-4 h-4" /> Delete Asset</>}
            </button>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-[var(--color-border)] text-[var(--color-text)] text-xs font-sans font-bold hover:bg-[var(--color-elevated)] active:scale-95 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> View Original
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
