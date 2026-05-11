import React, { useState, useRef, useEffect } from "react";
import CustomVideoPlayer from "../common/CustomVideoPlayer";

interface MessageBubbleProps {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
  isRead?: boolean;
  senderName?: string;
  showSenderName?: boolean;
  isSystemMessage?: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  onReply?: (msg: any) => void;
  onEdit?: (msg: any) => void;
  onDelete?: (id: string) => void;
  onReport?: (id: string, text: string, senderId: string) => void;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  senderId?: string;
}

const nameColors = [
  "text-blue-500",
  "text-green-500",
  "text-purple-500",
  "text-orange-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
];

const getNameColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return nameColors[Math.abs(hash) % nameColors.length];
};

export default function MessageBubble({ 
  id, text, time, isMe, isRead, senderName, showSenderName, isSystemMessage, replyTo,
  onReply, onEdit, onDelete, onReport, mediaUrl, mediaType, senderId 
}: MessageBubbleProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[MessageBubble_DEBUG]", { id, text, mediaUrl, mediaType });
  }, [id, mediaUrl, mediaType]);

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);

    // Long press detection
    longPressTimer.current = setTimeout(() => {
      const rect = bubbleRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPos({ x: rect.left + rect.width / 2, y: rect.top });
        setShowMenu(true);
        if (window.navigator.vibrate) window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = Math.abs(currentY - touchStartY.current);

    if (deltaY > 10) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }

    if (deltaX > 0 && deltaX < 100) {
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    if (swipeOffset > 60) {
      onReply?.({ id, text, senderName: senderName || (isMe ? "Me" : "Them") });
    }
    
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSystemMessage) return;
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  if (isSystemMessage) {
    const displayText = isMe ? text.replace("Admin", "You") : text;
    return (
      <div className="flex justify-center my-4">
        <span className="px-4 py-2 bg-timber-input-bg border border-timber-border text-timber-brand text-[11px] font-bold rounded-full shadow-sm max-w-[80%] text-center">
          {displayText}
        </span>
      </div>
    );
  }

  return (
    <div 
      ref={bubbleRef}
      className={`flex flex-col mb-4 relative transition-transform duration-200 ${isMe ? "items-end" : "items-start"}`}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      {/* Swipe Indicator */}
      {swipeOffset > 20 && (
        <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 text-timber-brand opacity-50">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
           </svg>
        </div>
      )}

      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all duration-200 relative group ${
          isMe
            ? "bg-timber-bubble-sent text-timber-bubble-sent-text rounded-br-none"
            : "bg-timber-bubble-recv text-timber-bubble-recv-text border border-timber-border rounded-bl-none"
        }`}
      >
        {!isMe && showSenderName && senderName && (
          <p className={`text-[11px] font-bold mb-1 ${getNameColor(senderName)}`}>
            {senderName}
          </p>
        )}

        {/* Reply Context */}
        {replyTo && (
          <div className={`mb-2 p-2 rounded-lg text-xs border-l-4 ${
            isMe ? "bg-black/10 border-white/30" : "bg-elevated border-timber-placeholder"
          }`}>
            <p className="font-bold mb-0.5">{replyTo.senderName}</p>
            <p className="opacity-80 line-clamp-2">{replyTo.text}</p>
          </div>
        )}

        {/* Media Content */}
        {mediaUrl && (
          <div className={`overflow-hidden rounded-2xl block ${text ? 'mb-[6px]' : ''}`} style={{ maxWidth: '220px' }}>
            {mediaType === 'video' ? (
              <CustomVideoPlayer 
                src={mediaUrl} 
                className="w-full h-auto max-w-[220px]" 
              />
            ) : (
              <img 
                src={mediaUrl} 
                alt="Message media" 
                className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity block"
                style={{ maxWidth: '220px' }}
                onClick={() => window.open(mediaUrl, '_blank')}
              />
            )}
          </div>
        )}

        {text && <p className="leading-relaxed whitespace-pre-wrap">{text}</p>}

        {/* Desktop Quick Reply Button */}
        <button 
          onClick={() => onReply?.({ id, text, senderName: senderName || (isMe ? "Me" : "Them") })}
          className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-timber-muted opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      </div>

      <div className={`flex items-center gap-1 mt-1 px-1`}>
        <span className="text-[10px] text-timber-muted font-medium uppercase tracking-wider">{time}</span>
        {isMe && (
          <div className="flex -ml-0.5">
            <svg 
              className={`w-3.5 h-3.5 -mr-1.5 ${isRead ? "text-blue-500" : "text-timber-muted"}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <svg 
              className={`w-3.5 h-3.5 ${isRead ? "text-blue-500" : "text-timber-muted"}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Context Menu Modal */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setShowMenu(false)}
          ></div>
          <div 
            className="fixed z-[110] bg-surface rounded-2xl shadow-2xl border border-timber-border py-2 w-40 animate-in fade-in zoom-in duration-150"
            style={{ 
              top: Math.min(menuPos.y, window.innerHeight - 150), 
              left: Math.min(menuPos.x, window.innerWidth - 170) 
            }}
          >
            <button 
              onClick={() => { onReply?.({ id, text, senderName: senderName || (isMe ? "Me" : "Them") }); setShowMenu(false); }}
              className="w-full px-4 py-2 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
            {isMe && (
              <>
                <button 
                  onClick={() => { onEdit?.({ id, text }); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button 
                  onClick={() => { onDelete?.(id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
            {!isMe && (
              <button 
                onClick={() => { onReport?.(id, text, senderId || ""); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
