"use client";

import React, { useState } from 'react';
import { MoreHorizontal, Users, Shield, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmModal } from '../shared/ConfirmModal';
import { useToast } from '../shared/useToast';
import { useAdmin } from '@/context/AdminContext';

interface GroupsTableProps {
  groups: any[];
  pagination: any;
  loading: boolean;
  onPageChange: (page: number) => void;
  onGroupClick: (id: string) => void;
  onRefresh: () => void;
}

export function GroupsTable({ groups, pagination, loading, onPageChange, onGroupClick, onRefresh }: GroupsTableProps) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    groupId: string | null;
    groupName: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    groupId: null,
    groupName: null,
    isLoading: false
  });

  const handleDelete = async () => {
    if (!modalState.groupId) return;
    setModalState(s => ({ ...s, isLoading: true }));
    try {
      const res = await fetch(`/api/admin/groups/${modalState.groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast({ message: "Group deleted successfully", type: 'success' });
        onRefresh();
        setModalState({ isOpen: false, groupId: null, groupName: null, isLoading: false });
      }
    } catch (err) {
      addToast({ message: "Failed to delete group", type: 'error' });
    } finally {
      setModalState(s => ({ ...s, isLoading: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden animate-pulse">
        <div className="h-[400px] bg-[var(--color-elevated)]/20" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-sm relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-elevated)]/30">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Group Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Members</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Administrator</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">Last Activity</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {groups.length > 0 ? groups.map((group) => (
              <tr 
                key={group._id} 
                className="group hover:bg-[var(--color-elevated)]/50 transition-all duration-300 cursor-pointer"
                onClick={() => onGroupClick(group._id)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                      {group.groupPhoto ? (
                        <img src={group.groupPhoto} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Users className="w-4 h-4 text-[var(--color-muted)]" />
                      )}
                    </div>
                    <span className="text-sm font-bold font-sans text-[var(--color-text)]">{group.name || 'Unnamed Group'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono text-[var(--color-muted)]">{group.participants?.length || 0}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-[var(--color-text)]">
                      {group.createdBy?.name || group.createdBy?.username || 'Platform Admin'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={group.status || 'active'} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono text-[var(--color-muted)]">{new Date(group.updatedAt).toLocaleDateString('en-GB')}</span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                   <div className="relative inline-block text-left">
                    <button 
                      onClick={() => setActionMenuId(actionMenuId === group._id ? null : group._id)}
                      className="p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all duration-300 active:scale-95"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {actionMenuId === group._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => onGroupClick(group._id)}
                          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-sans text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" /> View Details
                        </button>
                        <button 
                          onClick={() => {
                            setModalState({ isOpen: true, groupId: group._id, groupName: group.name, isLoading: false });
                            setActionMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-sans text-red-600 hover:bg-red-600/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Group
                        </button>
                      </div>
                    )}
                   </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-[var(--color-muted)] font-sans italic">
                  No groups found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-[var(--color-elevated)]/20 border-t border-[var(--color-border)] flex items-center justify-between">
        <p className="text-xs font-sans text-[var(--color-muted)]">
          Page <span className="font-mono text-[var(--color-text)] font-bold">{pagination.page}</span> of <span className="font-mono text-[var(--color-text)] font-bold">{pagination.totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-4 py-2 rounded-full text-xs font-sans font-medium text-[var(--color-text)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-[var(--color-elevated)] transition-all active:scale-95"
          >
            Previous
          </button>
          <button 
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 rounded-full text-xs font-sans font-medium text-[var(--color-text)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-[var(--color-elevated)] transition-all active:scale-95"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={modalState.isOpen}
        title="DELETE GROUP"
        description={`Are you sure you want to delete "${modalState.groupName}"? All messages and data will be permanently removed.`}
        requireTypedConfirm={true}
        confirmWord="DELETE"
        isLoading={modalState.isLoading}
        onConfirm={handleDelete}
        onCancel={() => setModalState({ isOpen: false, groupId: null, groupName: null, isLoading: false })}
      />
    </div>
  );
}
