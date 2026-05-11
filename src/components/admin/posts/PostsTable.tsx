import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  User, 
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';

interface PostsTableProps {
  filters: any;
  page: number;
  onDataLoad: (pagination: any) => void;
}

export function PostsTable({ filters, page, onDataLoad }: PostsTableProps) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          search: filters.search || '',
          sortBy: filters.sortBy || 'newest'
        });
        const res = await fetch(`/api/admin/posts?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
          onDataLoad(data.pagination);
        }
      } catch (err) {
        console.error("[ADMIN_POSTS_FETCH_FAILED]", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, [token, filters, page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, { // Fixed: added delete logic to route or using query? 
        // Wait, my route used params.id but Next.js app router dynamic routes need folder structure.
        // I'll adjust the API call to /api/admin/posts/[id] later if needed, but for now I'll use query param or fix route.
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // I'll fix the route to handle DELETE with id in query or params.
      // Actually, let's assume I'll fix the route to use query param for now to avoid folder creation overhead.
      // Wait, I already created the route. Let's check it.
    } catch (e) {}
  };

  // Improved delete handler matching the route structure
  const handleAdminDelete = async (postId: string) => {
    if (!confirm("Permanently remove this content from the platform?")) return;

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast({ message: "Content removed successfully", type: 'success' });
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      addToast({ message: "Failed to delete post", type: 'error' });
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--color-elevated)] rounded-3xl w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[var(--color-elevated)] rounded-2xl flex items-center justify-center text-[var(--color-muted)] mb-4">
          <MessageSquare className="w-8 h-8 opacity-20" />
        </div>
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-1">No Posts Found</h3>
        <p className="text-sm text-[var(--color-muted)] font-sans max-w-xs">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div 
          key={post.id}
          className="group flex items-start gap-6 p-6 rounded-3xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-brand)]/30 hover:bg-[var(--color-elevated)]/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          {/* Author Avatar */}
          <div className="w-12 h-12 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] shrink-0 overflow-hidden shadow-sm">
            {post.author?.avatar || post.author?.profilePhoto ? (
              <img src={post.author.avatar || post.author.profilePhoto} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] opacity-50">
                <User className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold font-sans text-[var(--color-text)]">
                {post.author?.name || 'Unknown'}
              </span>
              <span className="text-xs font-mono text-[var(--color-muted)] opacity-60">
                @{post.author?.username || 'unknown'}
              </span>
              <span className="text-[var(--color-border)]">•</span>
              <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-tighter">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="text-sm font-sans text-[var(--color-text)] leading-relaxed mb-4 line-clamp-3">
              {post.content}
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-xs font-mono font-bold">{post.stats?.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-xs font-mono font-bold">{post.stats?.comments || 0}</span>
              </div>
              {post.hasMedia && (
                <div className="flex items-center gap-1.5 text-[var(--color-brand)]">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold font-sans uppercase tracking-widest">Media Attached</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleAdminDelete(post.id)}
              className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Delete Content"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-xl bg-[var(--color-elevated)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all border border-[var(--color-border)] shadow-sm">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
