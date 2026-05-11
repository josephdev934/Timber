import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import CommentItem from "./CommentItem";
import MentionDropdown from "./MentionDropdown";
import CustomVideoPlayer from "../common/CustomVideoPlayer";

interface PostCardProps {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  content: string;
  images?: string[];
  video?: string;
  timestamp: string;
  likes?: string[];
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  onLikeUpdate?: (postId: string, data: { likeCount: number; likedByCurrentUser: boolean }) => void;
  onDelete?: (postId: string) => void;
  stats?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

/**
 * ==========================================
 * COMPONENT: PostCard
 * ==========================================
 */
export default function PostCard({
  id,
  author,
  content,
  images = [],
  video,
  timestamp,
  likes = [],
  likeCount,
  commentCount,
  likedByCurrentUser,
  onLikeUpdate,
  onDelete,
}: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [liked, setLiked] = useState(likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(likeCount);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Mentions
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [isSearchingMentions, setIsSearchingMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<number | null>(null);

  useEffect(() => {
    console.log("[PostCard_DEBUG]", { id, images, video });
  }, [id, images, video]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setCommentText(value);

    // Detect @mention trigger
    const textBeforeCursor = value.substring(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      // Ensure no spaces between @ and cursor
      if (!query.includes(" ")) {
        setMentionQuery(query);
        return;
      }
    }
    setMentionQuery(null);
    setMentionSuggestions([]);
  };

  const handleSelectMention = (mentionedUser: any) => {
    const lastAtIdx = commentText.substring(0, commentText.length).lastIndexOf("@");
    if (lastAtIdx === -1) return;

    const newText = 
      commentText.substring(0, lastAtIdx) + 
      `@${mentionedUser.username} ` + 
      commentText.substring(lastAtIdx + (mentionQuery?.length || 0) + 1);
    
    setCommentText(newText);
    setMentionQuery(null);
    setMentionSuggestions([]);
  };

  useEffect(() => {
    if (mentionQuery === null) return;

    const timeoutId = setTimeout(async () => {
      setIsSearchingMentions(true);
      try {
        const token = localStorage.getItem("timber_token");
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMentionSuggestions(data);
        }
      } catch (err) {
        console.error("Mention search failed", err);
      } finally {
        setIsSearchingMentions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [mentionQuery]);

  // Sync like state when props or user changes
  useEffect(() => {
    setLiked(likedByCurrentUser);
    setLikesCount(likeCount);
    setLocalCommentCount(commentCount);
  }, [user, likedByCurrentUser, likeCount, commentCount]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${id}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data || []);
      }
    } catch (err) {
      console.error("[COMMENT_FETCH_FAILED]", err);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push("/register");
      return;
    }

    const previousLiked = liked;
    const previousCount = likesCount;

    // Optimistic UI
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error();
      
      // OPTION A: Sync with server truth
      const data = await res.json();
      setLiked(data.likedByCurrentUser);
      setLikesCount(data.likeCount);
      onLikeUpdate?.(id, data);
    } catch (err) {
      // Rollback
      setLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/register");
      return;
    }
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contentId: id,
          text: commentText
        })
      });

      if (res.ok) {
        setCommentText("");
        setLocalCommentCount(prev => prev + 1);
        fetchComments(); // Refresh list
      }
    } catch (err) {
      console.error("[COMMENT_POST_FAILED]", err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  return (
    <div className="bg-surface border border-timber-border rounded-3xl overflow-hidden mb-6 shadow-sm transition-all hover:shadow-md">
      {/* Author Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-timber-border bg-timber-input-bg">
            <img src={author.avatar || undefined} alt={author.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-timber-text leading-tight">{author.name}</h4>
            <p className="text-[11px] text-timber-muted font-medium uppercase tracking-wider">
              {author.username} • {timestamp}
            </p>
          </div>
        </div>
        
        {user && author.username === `@${user.username}` && (
          <button 
            onClick={async () => {
              if (window.confirm("Are you sure you want to delete this post?")) {
                try {
                  const token = localStorage.getItem("timber_token");
                  const res = await fetch(`/api/posts/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) {
                    onDelete?.(id);
                  }
                } catch (err) {
                  console.error("Failed to delete post", err);
                }
              }
            }}
            className="text-timber-placeholder hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950"
            title="Delete post"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Media Content (Grid / Video) - Positioned between header and text */}
      <div className="px-5 pb-4">
        {images && images.length > 0 && (
          <div 
            className={`grid gap-2 mb-4 rounded-3xl overflow-hidden border border-timber-border bg-timber-input-bg ${
              images.length === 1 ? "grid-cols-1" : 
              images.length === 2 ? "grid-cols-2" : 
              images.length === 3 ? "grid-cols-5 grid-rows-2" : 
              "grid-cols-2 grid-rows-2"
            }`} 
            style={{ height: images.length === 1 ? 'auto' : '320px' }}
          >
            {images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveLightbox(idx)}
                className={`relative cursor-pointer hover:opacity-90 transition-opacity ${
                  images.length === 1 ? "w-full" :
                  images.length === 3 && idx === 0 ? "col-span-3 row-span-2" : 
                  images.length === 3 ? "col-span-2" :
                  ""
                }`}
              >
                <img 
                  src={img} 
                  className="w-full h-full object-cover" 
                  alt="Post content" 
                  style={{ maxHeight: images.length === 1 ? '400px' : 'none' }}
                />
              </div>
            ))}
          </div>
        )}

        {video && (
          <CustomVideoPlayer 
            src={video} 
            className="w-full mb-4 border border-timber-border rounded-3xl"
            style={{ maxHeight: '400px' }}
          />
        )}

        {/* Text Content */}
        <p className="text-timber-text text-[15px] leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {/* Lightbox Overlay */}
      {activeLightbox !== null && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
           <header className="h-16 px-6 flex items-center justify-between text-white border-b border-white/10">
              <span className="font-bold text-sm uppercase tracking-widest opacity-60">
                 {activeLightbox + 1} / {images.length}
              </span>
              <button onClick={() => setActiveLightbox(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
              </button>
           </header>
           <div className="flex-grow relative flex items-center justify-center p-4">
              <img src={images[activeLightbox]} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt="Fullscreen" />
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveLightbox((activeLightbox - 1 + images.length) % images.length)}
                    className="absolute left-4 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setActiveLightbox((activeLightbox + 1) % images.length)}
                    className="absolute right-4 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
           </div>
        </div>
      )}

      {/* Stats & Actions */}
      <div className="px-5 py-4 flex items-center gap-6 border-t border-timber-input-border">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 transition-all active:scale-90 group ${liked ? "text-red-500" : "text-timber-brand"}`}
        >
          <div className={`p-2.5 rounded-full transition-colors ${liked ? "bg-red-50 dark:bg-red-950" : "group-hover:bg-elevated"}`}>
            <svg className={`w-5 h-5 ${liked ? "fill-current" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xs font-black tracking-tighter">{likesCount}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 transition-all group ${showComments ? "text-timber-brand" : "text-timber-muted"}`}
        >
          <div className={`p-2.5 rounded-full transition-colors ${showComments ? "bg-elevated text-timber-brand" : "group-hover:bg-elevated"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xs font-black tracking-tighter">{localCommentCount}</span>
        </button>

        <button className="ml-auto p-2.5 text-timber-muted hover:text-timber-brand hover:bg-elevated rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Dynamic Comment Section */}
      {showComments && (
        <div className="px-5 pb-5 pt-2 border-t border-timber-input-border bg-page">
          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-6">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-elevated border border-timber-border">
              <img 
                src={user?.avatar || "/default-avatar.svg"} 
                alt="Me" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-grow relative">
              <input 
                type="text" 
                placeholder="Write a comment..." 
                className="w-full bg-timber-input-bg border-none rounded-full py-2.5 px-5 text-xs focus:ring-2 focus:ring-timber-brand/20 text-timber-text placeholder-timber-placeholder transition-all"
                value={commentText}
                onChange={handleInputChange}
              />
              {mentionQuery !== null && (
                <MentionDropdown 
                  users={mentionSuggestions} 
                  isLoading={isSearchingMentions} 
                  onSelect={handleSelectMention} 
                />
              )}
              <button 
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="absolute right-2 top-1.5 text-timber-brand p-1 disabled:opacity-30 active:scale-90 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </form>

          {/* Comment List */}
          <div className="space-y-5">
            {comments.length > 0 ? (
              comments.map((comment: any) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  contentId={id} 
                  onRefresh={fetchComments} 
                />
              ))
            ) : (
              <div className="flex flex-col items-center py-6">
                <p className="text-[11px] font-bold text-timber-placeholder uppercase tracking-[0.2em]">No conversations yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}