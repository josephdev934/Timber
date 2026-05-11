"use client";

import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Calendar, Trash2, Archive, Edit3, UserMinus, UserPlus, Info } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { useToast } from '../shared/useToast';
import { ConfirmModal } from '../shared/ConfirmModal';

interface GroupDetailDrawerProps {
  groupId: string | null;
  onClose: () => void;
}

export function GroupDetailDrawer({ groupId, onClose }: GroupDetailDrawerProps) {
  const { admin, token } = useAdmin();
  const { addToast } = useToast();
  
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchGroupDetail = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      }
    } catch (err) {
      console.error("[GROUP_DETAIL_FETCH_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!groupId || !admin) return;
    setIsJoining(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/members/${admin.id || (admin as any)._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast({ message: "You have joined the group secretly", type: 'success' });
        fetchGroupDetail(); // Refresh
      }
    } catch (err) {
      addToast({ message: "Failed to join group", type: 'error' });
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetail();
      setActiveTab('info');
    } else {
      setGroup(null);
    }
  }, [groupId]);

  const handleDisband = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast({ message: "Group disbanded successfully", type: 'success' });
        onClose();
      }
    } catch (err) {
      addToast({ message: "Failed to disband group", type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!groupId) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${groupId && !showDeleteModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-[var(--color-bg)] border-l border-[var(--color-border)] z-[70] shadow-2xl transition-transform duration-500 transform ${groupId && !showDeleteModal ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-sans text-[var(--color-text)] tracking-tight">Group Management</h2>
                <p className="text-xs font-mono text-[var(--color-muted)]">{groupId}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)] transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-6">
                <SkeletonLoader className="h-40 w-full rounded-3xl" />
                <SkeletonLoader className="h-10 w-full rounded-xl" />
                <SkeletonLoader className="h-64 w-full rounded-3xl" />
              </div>
            ) : group ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Group Identity */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-3xl bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-4 shadow-xl overflow-hidden">
                    {group.groupPhoto ? (
                      <img src={group.groupPhoto} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-10 h-10 text-[var(--color-muted)]" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold font-sans text-[var(--color-text)]">{group.name || 'Unnamed Group'}</h3>
                  <p className="text-sm font-sans text-[var(--color-muted)]">
                    Managed by <span className="text-[var(--color-text)] font-bold">{group.createdBy?.name || group.createdBy?.username || 'Platform Admin'}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${group.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {group.status || 'active'}
                     </span>
                     <span className="px-3 py-1 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] text-[10px] font-bold font-mono text-[var(--color-muted)]">
                        {group.participants?.length || 0} MEMBERS
                     </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--color-border)]">
                  {['info', 'members'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`flex-1 py-3 text-sm font-bold font-sans transition-all relative ${activeTab === tab ? 'text-[var(--color-brand)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
                    >
                      {tab.toUpperCase()}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand)] shadow-[0_0_8px_var(--color-brand)]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                  {activeTab === 'info' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-elevated)]/30 border border-[var(--color-border)]">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-[var(--color-muted)]" />
                            <span className="text-sm font-sans text-[var(--color-muted)]">Created On</span>
                          </div>
                          <span className="text-sm font-mono font-bold text-[var(--color-text)]">
                            {new Date(group.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-elevated)]/30 border border-[var(--color-border)]">
                          <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-[var(--color-muted)]" />
                            <span className="text-sm font-sans text-[var(--color-muted)]">Creator</span>
                          </div>
                          <span className="text-sm font-sans font-bold text-[var(--color-text)]">
                            @{group.createdBy?.username || 'system'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] px-1">Admin Actions</p>
                        
                        {!group.participants?.some((p: any) => p._id === (admin?.id || (admin as any)?._id)) && (
                          <button 
                            onClick={handleJoin}
                            disabled={isJoining}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20 transition-all active:scale-95 text-sm font-bold font-sans disabled:opacity-50"
                          >
                            {isJoining ? <SkeletonLoader className="h-4 w-4 rounded-full" /> : <UserPlus className="w-4 h-4" />}
                            Join Group Secretly
                          </button>
                        )}

                        <button 
                          onClick={() => setShowDeleteModal(true)}
                          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-all active:scale-95 text-sm font-bold font-sans"
                        >
                          <Trash2 className="w-4 h-4" /> Disband Group
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'members' && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      {group.participants?.length > 0 ? group.participants.map((member: any) => (
                        <div key={member._id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand)]/30 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center">
                              {member.profilePhoto ? (
                                <img src={member.profilePhoto} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <span className="text-[10px] font-bold">{member.name?.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold font-sans text-[var(--color-text)]">{member.name}</p>
                              <p className="text-[10px] font-mono text-[var(--color-muted)]">@{member.username}</p>
                            </div>
                          </div>
                          {(member._id === (group.createdBy?._id || group.createdBy) || member.id === (group.createdBy?.id || group.createdBy)) ? (
                            <span className="px-2 py-1 rounded-md bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-[8px] font-bold uppercase tracking-tighter">Owner</span>
                          ) : (
                            <button className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-muted)] hover:text-red-500 transition-all">
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )) : (
                        <p className="text-center py-10 text-sm text-[var(--color-muted)] italic">No members found.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-10">
                <Info className="w-12 h-12 text-[var(--color-muted)] mb-4 opacity-20" />
                <p className="text-[var(--color-muted)] font-sans italic">Group not found or already deleted.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        title="DISBAND GROUP"
        description={`This will permanently delete the group "${group?.name}" and all its message history. This action cannot be undone.`}
        requireTypedConfirm={true}
        confirmWord="DISBAND"
        isLoading={isDeleting}
        onConfirm={handleDisband}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
