"use client";

import React from "react";
import Link from "next/link";

export type NotificationType = "mention" | "reply" | "comment_on_post" | "message" | "reaction" | "system";

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  actor?: {
    name: string;
    username: string;
    avatar: string;
  };
  message: string;
  metadata?: {
    contentId?: string;
    chatId?: string;
    commentId?: string;
    link?: string;
  };
  isRead: boolean;
  createdAt: string;
  onDelete?: (id: string) => void;
}

/**
 * ==========================================
 * COMPONENT: NotificationItem
 * ==========================================
 */
export default function NotificationItem({
  id,
  type,
  actor,
  message,
  metadata,
  isRead,
  createdAt,
  onDelete,
}: NotificationItemProps) {
  const isUnread = !isRead;
  const link = metadata?.link || (metadata?.chatId ? `/messages?chatId=${metadata.chatId}` : undefined);

  const handleMarkAsRead = async () => {
    if (!isUnread) return;
    try {
      const token = localStorage.getItem("timber_token");
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new CustomEvent('notifications:read'));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(id);
  };

  const time = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const displayTime = `${date} at ${time}`;

  const getIcon = () => {
    switch (type) {
      case "mention": return "@";
      case "reply": return "↩";
      case "message": return "💬";
      case "reaction": return "♡";
      default: return "•";
    }
  };

  const content = (
    <div className={`p-5 flex gap-4 transition-all relative group border-b border-timber-border ${isUnread ? "bg-elevated" : "bg-surface hover:bg-elevated"}`}>
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-timber-brand rounded-r-full" />
      )}

      {/* Avatar Group */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-timber-border group-hover:border-timber-brand transition-colors bg-elevated">
          <img src={actor?.avatar || undefined} alt={actor?.name || "User"} className="w-full h-full object-cover" />
        </div>
        
        {/* Type Icon Badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface rounded-full flex items-center justify-center text-[10px] shadow-sm border border-timber-border text-timber-brand font-bold">
          {getIcon()}
        </div>
      </div>
 
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className="font-bold text-timber-text text-sm group-hover:text-timber-brand transition-colors">
            {actor?.name || actor?.username || "Unknown User"}
            <span className="ml-2 font-medium text-timber-muted text-[10px] uppercase tracking-wider">{displayTime}</span>
          </h4>
          <div className="flex items-center gap-3">
            {isUnread && <div className="w-1.5 h-1.5 bg-timber-brand rounded-full" />}
            <button 
              onClick={handleDelete}
              className="p-1.5 text-timber-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-full opacity-0 group-hover:opacity-100 transition-all active:scale-90"
              title="Delete Notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-[13px] text-timber-muted leading-snug">
          {message}
        </p>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link} onClick={handleMarkAsRead}>{content}</Link>;
  }

  return <div onClick={handleMarkAsRead} className="cursor-pointer">{content}</div>;
}
