import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { renderTextWithMentions } from "@/application/utils/textUtils";
import MentionDropdown from "./MentionDropdown";

interface CommentItemProps {
  comment: any;
  contentId: string;
  onRefresh: () => void;
  depth?: number;
}

/**
 * ==========================================
 * COMPONENT: CommentItem (Recursive)
 * ==========================================
 * Handles individual comment display, liking, and nested replies.
 */
export default function CommentItem({ comment, contentId, onRefresh, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(user ? (comment.likes || []).includes(user.id) : false);
  const [likesCount, setLikesCount] = useState(comment.likes?.length || 0);
  
  // Mentions
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [isSearchingMentions, setIsSearchingMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setReplyText(value);

    // Detect @mention trigger
    const textBeforeCursor = value.substring(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        return;
      }
    }
    setMentionQuery(null);
    setMentionSuggestions([]);
  };

  const handleSelectMention = (mentionedUser: any) => {
    const lastAtIdx = replyText.substring(0, replyText.length).lastIndexOf("@");
    if (lastAtIdx === -1) return;

    const newText = 
      replyText.substring(0, lastAtIdx) + 
      `@${mentionedUser.username} ` + 
      replyText.substring(lastAtIdx + (mentionQuery?.length || 0) + 1);
    
    setReplyText(newText);
    setMentionQuery(null);
    setMentionSuggestions([]);
  };

  React.useEffect(() => {
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

  // Sync state with props
  React.useEffect(() => {
    if (user) {
      setLiked((comment.likes || []).includes(user.id));
    }
    setLikesCount(comment.likes?.length || 0);
  }, [user, comment.likes]);

  const handleLike = async () => {
    if (!user) return;
    
    // Optimistic
    const prevLiked = liked;
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevLiked ? likesCount : likesCount);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch(`/api/comments/${comment.id}/reply`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contentId,
          text: replyText
        })
      });

      if (res.ok) {
        setReplyText("");
        setShowReplyInput(false);
        onRefresh();
      }
    } catch (err) {
      console.error("[REPLY_FAILED]", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${depth > 0 ? "mt-4" : ""}`}>
      <div className="flex gap-3">
        <div className={`${depth > 0 ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden flex-shrink-0 border border-timber-border bg-elevated`}>
          <img src={comment.author?.avatar || "/default-avatar.svg"} className="w-full h-full object-cover" />
        </div>
        <div className="flex-grow min-w-0">
          <div className={`${depth > 0 ? 'bg-elevated' : 'bg-surface'} p-3.5 rounded-xl border border-timber-border shadow-sm mb-1.5`}>
            <div className="flex justify-between items-center mb-1">
               <span className="font-bold text-timber-brand text-[11px]">@{comment.author?.username || 'user'}</span>
               <span className="text-[9px] text-timber-muted font-bold uppercase tracking-widest">Just now</span>
            </div>
            <p className={`${depth > 0 ? 'text-[11px]' : 'text-xs'} text-timber-text leading-relaxed`}>
              {renderTextWithMentions(comment.text)}
            </p>
          </div>
          
          <div className="flex gap-4 px-1">
             <button 
               onClick={handleLike}
               className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors active:scale-95 ${liked ? "text-red-500" : "text-timber-muted hover:text-timber-brand"}`}
             >
                <svg className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likesCount}
             </button>
             <button 
               onClick={() => setShowReplyInput(!showReplyInput)}
               className={`text-[9px] font-bold uppercase tracking-widest transition-colors active:scale-95 ${showReplyInput ? "text-timber-brand" : "text-timber-muted hover:text-timber-brand"}`}
             >
               Reply
             </button>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
               <input 
                 type="text" 
                 autoFocus
                 placeholder={`Reply to @${comment.author?.username}...`}
                 className="flex-grow bg-timber-input-bg border-none rounded-xl py-2 px-4 text-[11px] focus:ring-1 focus:ring-timber-brand/20 text-timber-text placeholder-timber-placeholder transition-all"
                 value={replyText}
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
                 disabled={!replyText.trim() || submitting}
                 className="bg-timber-brand text-white px-4 py-1 rounded-xl text-[10px] font-bold disabled:opacity-30 active:scale-95 shadow-sm transition-all"
               >
                 Post
               </button>
            </form>
          )}
        </div>
      </div>

      {/* Recursive Children (Replies) */}
      {comment.children && comment.children.length > 0 && (
        <div className="pl-6 border-l border-timber-border ml-4">
           {comment.children.map((child: any) => (
             <CommentItem 
               key={child.id} 
               comment={child} 
               contentId={contentId} 
               onRefresh={onRefresh} 
               depth={depth + 1} 
             />
           ))}
        </div>
      )}
    </div>
  );
}
