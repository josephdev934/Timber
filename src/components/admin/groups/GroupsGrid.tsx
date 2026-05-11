"use client";

import React from 'react';
import { MoreHorizontal, Users, Shield, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';

interface GroupsGridProps {
  groups: any[];
  loading: boolean;
  onGroupClick: (id: string) => void;
}

export function GroupsGrid({ groups, loading, onGroupClick }: GroupsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-64 rounded-3xl bg-[var(--color-elevated)]/20 border border-[var(--color-border)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.length > 0 ? groups.map((group) => (
        <div 
          key={group._id} 
          onClick={() => onGroupClick(group._id)}
          className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          {/* Group Photo / Header */}
          <div className="relative h-40 bg-[var(--color-elevated)] overflow-hidden">
            {group.groupPhoto ? (
              <img src={group.groupPhoto} alt={group.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <Users className="w-20 h-20 text-[var(--color-text)]" />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <button className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-4 left-4">
              <StatusBadge status={group.status || 'active'} className="shadow-lg" />
            </div>
          </div>

          {/* Group Info */}
          <div className="p-6">
            <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-1 truncate">{group.name || 'Unnamed Group'}</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-muted)]">
                <Users className="w-3.5 h-3.5" />
                {group.participants?.length || 0} members
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden shrink-0">
                  {group.createdBy?.profilePhoto ? (
                    <img src={group.createdBy.profilePhoto} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold font-sans text-[var(--color-text)]">
                      {(group.createdBy?.name || group.createdBy?.username)?.charAt(0) || 'P'}
                    </span>
                  )}
                </div>
                <span className="text-xs font-sans font-medium text-[var(--color-muted)] truncate max-w-[120px]">
                  {group.createdBy?.name || group.createdBy?.username || 'Platform Admin'}
                </span>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand)] hover:underline">
                View Detail
              </button>
            </div>
          </div>
        </div>
      )) : (
        <div className="col-span-full text-center py-20 text-[var(--color-muted)] font-sans italic">
           No groups found matching your criteria.
        </div>
      )}
    </div>
  );
}
