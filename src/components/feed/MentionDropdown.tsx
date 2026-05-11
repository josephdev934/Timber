import React from "react";

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface MentionDropdownProps {
  users: User[];
  onSelect: (user: User) => void;
  isLoading?: boolean;
}

/**
 * ==========================================
 * COMPONENT: MentionDropdown
 * ==========================================
 * Displays a list of users for selection during @mention.
 */
export default function MentionDropdown({ users, onSelect, isLoading }: MentionDropdownProps) {
  if (isLoading) {
    return (
      <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface rounded-2xl shadow-2xl border border-timber-border p-4 z-50">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 bg-elevated rounded-full"></div>
          <div className="flex-grow space-y-2">
            <div className="h-3 bg-elevated rounded w-1/2"></div>
            <div className="h-2 bg-elevated rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface rounded-2xl shadow-2xl border border-timber-border overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-4 py-2 bg-elevated border-b border-timber-border">
        <span className="text-[10px] font-black uppercase tracking-widest text-timber-muted">Mention Someone</span>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => onSelect(user)}
            className="flex items-center gap-3 p-3 hover:bg-elevated cursor-pointer transition-colors group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-timber-border flex-shrink-0 bg-elevated">
              <img src={user.avatar || undefined} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-bold text-timber-text truncate">{user.name}</p>
              <p className="text-[10px] text-timber-muted truncate group-hover:text-timber-brand transition-colors">@{user.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
