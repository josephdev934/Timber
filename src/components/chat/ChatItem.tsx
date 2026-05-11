"use client";

import React from "react";

interface ChatItemProps {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isGroup: boolean;
  groupPhoto: string;
  isActive: boolean;
  isOnline?: boolean;
  onSelect: (id: string) => void;
}
 
/**
 * ==========================================
 * COMPONENT: ChatItem
 * ==========================================
 */
export default function ChatItem({
  id,
  name,
  lastMessage,
  time,
  unreadCount,
  isGroup,
  groupPhoto,
  isActive,
  isOnline,
  onSelect,
}: ChatItemProps) {
  return (
    <div
      onClick={() => onSelect(id)}
      className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 border-b border-timber-border ${
        isActive ? "bg-elevated" : "hover:bg-elevated"
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-timber-border bg-elevated">
          <img src={groupPhoto || undefined} alt={name} className="w-full h-full object-cover" />
        </div>
        {!isGroup && isOnline && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#4ADE80] border-2 border-surface rounded-full"></div>
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h4 className={`font-semibold truncate ${isActive ? "text-timber-brand" : "text-timber-text"}`}>{name}</h4>
          <span className="text-[11px] text-timber-muted">{time}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-timber-muted truncate mr-2">{lastMessage}</p>
          {unreadCount > 0 && (
            <span className="bg-timber-brand text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
