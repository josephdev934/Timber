"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Mail, MapPin, Globe, Clock, Ban, ShieldCheck, Trash2, Edit3, MessageCircle } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '../shared/useToast';

export interface UserDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const { token } = useAdmin();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  // Tab Cache
  const [tabData, setTabData] = useState<any>({
    activity: null,
    content: null,
    security: null
  });
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (err) {
        console.error("[USER_DRAWER_FETCH_FAILED]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    // Reset cache on user change
    setTabData({ activity: null, content: null, security: null });
    setActiveTab('profile');
  }, [userId, token]);

  // Lazy Load Tabs
  useEffect(() => {
    if (activeTab === 'profile' || !userId || tabData[activeTab as keyof typeof tabData]) return;

    const fetchTab = async () => {
      setTabLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}/${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTabData((prev: any) => ({ ...prev, [activeTab]: data }));
        }
      } catch (err) {
        console.error(`[TAB_FETCH_FAILED_${activeTab.toUpperCase()}]`, err);
      } finally {
        setTabLoading(false);
      }
    };

    fetchTab();
  }, [activeTab, userId, token]);

  const handleModeration = async () => {
    const isBanned = userData.isBanned;
    const type = isBanned ? 'unban' : 'ban';
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/${type}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: type === 'ban' ? JSON.stringify({ reason: 'Admin suspension via drawer' }) : undefined
      });

      if (res.ok) {
        addToast({ message: `User ${isBanned ? 'unsuspended' : 'suspended'} successfully`, type: 'success' });
        setUserData({ ...userData, isBanned: !isBanned });
      }
    } catch (err) {
      addToast({ message: "Action failed", type: 'error' });
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-xl font-bold font-sans text-[var(--color-text)]">User Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)] transition-all duration-300 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-8 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <SkeletonLoader className="w-24 h-24 rounded-full" />
                <SkeletonLoader className="h-8 w-48 rounded" />
                <SkeletonLoader className="h-4 w-32 rounded" />
              </div>
              <SkeletonLoader className="h-[200px] w-full rounded-2xl" />
            </div>
          ) : (
            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-[var(--color-elevated)] border-2 border-[var(--color-border)] flex items-center justify-center overflow-hidden shadow-lg">
                    {userData.profilePhoto ? (
                      <img src={userData.profilePhoto} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-[var(--color-muted)]" />
                    )}
                  </div>
                  <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-[var(--color-bg)] ${userData.isBanned ? 'bg-red-500' : 'bg-emerald-500'}`} />
                </div>
                <h3 className="text-2xl font-bold font-sans text-[var(--color-text)]">{userData.name}</h3>
                <p className="text-[var(--color-muted)] font-mono text-sm mb-4">@{userData.username}</p>
                
                <div className="flex items-center gap-3">
                  <StatusBadge status={userData.isBanned ? 'banned' : 'active'} />
                  <span className="text-xs font-mono text-[var(--color-muted)]">
                    Joined {new Date(userData.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex border-b border-[var(--color-border)] mb-6">
                {['profile', 'activity', 'content'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-sans font-bold capitalize transition-all duration-300 relative ${
                      activeTab === tab ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand)]" />
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[var(--color-elevated)]/50 border border-[var(--color-border)]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Posts</p>
                      <p className="text-xl font-bold font-mono text-[var(--color-text)]">{userData.stats?.posts || 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--color-elevated)]/50 border border-[var(--color-border)]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Interactions</p>
                      <p className="text-xl font-bold font-mono text-[var(--color-text)]">{userData.stats?.interactions || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Information</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-sans text-[var(--color-muted)]">Email</span>
                        <span className="text-sm font-mono text-[var(--color-text)] font-medium">{userData.email}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-sans text-[var(--color-muted)]">Role</span>
                        <span className="text-sm font-sans text-[var(--color-text)] font-medium capitalize">{userData.role}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-sans text-[var(--color-muted)]">Bio</span>
                        <span className="text-sm font-sans text-[var(--color-text)] text-right max-w-[200px] truncate">{userData.bio || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {tabLoading ? (
                    <div className="space-y-4">
                      <SkeletonLoader className="h-16 w-full rounded-2xl" />
                      <SkeletonLoader className="h-16 w-full rounded-2xl" />
                    </div>
                  ) : tabData.activity?.activity?.length > 0 ? (
                    <div className="space-y-3">
                      {tabData.activity.activity.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-elevated)]/50 border border-[var(--color-border)] group hover:border-[var(--color-brand)]/30 transition-all">
                          <div className={`p-2 rounded-xl ${item.type === 'post' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                            {item.type === 'post' ? <Edit3 className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-sans text-[var(--color-text)] line-clamp-1">
                              {item.type === 'post' ? 'Created a new post' : 'Commented on a post'}
                            </p>
                            <p className="text-xs font-sans text-[var(--color-muted)] truncate italic">"{item.text}"</p>
                            <p className="text-[10px] font-mono text-[var(--color-muted)] mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                              {new Date(item.date).toLocaleString('en-GB')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] font-sans italic text-center py-10">No recent activity found.</p>
                  )}
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {tabLoading ? (
                    <div className="space-y-4">
                      <SkeletonLoader className="h-32 w-full rounded-2xl" />
                      <SkeletonLoader className="h-32 w-full rounded-2xl" />
                    </div>
                  ) : (tabData.content?.posts?.length > 0 || tabData.content?.comments?.length > 0) ? (
                    <>
                      {tabData.content.posts?.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Recent Posts</p>
                          {tabData.content.posts.slice(0, 3).map((post: any) => (
                            <div key={post._id} className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)] transition-all">
                              <p className="text-sm font-sans text-[var(--color-text)] line-clamp-2 mb-2">{post.content || post.text}</p>
                              <div className="flex items-center gap-4 text-[10px] font-mono text-[var(--color-muted)]">
                                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.commentCount || 0}</span>
                                <span>{new Date(post.createdAt).toLocaleDateString('en-GB')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {tabData.content.comments?.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Recent Comments</p>
                          {tabData.content.comments.slice(0, 3).map((comment: any) => (
                            <div key={comment._id} className="p-3 rounded-2xl bg-[var(--color-elevated)]/30 border border-[var(--color-border)] border-dashed">
                              <p className="text-xs font-sans text-[var(--color-text)] italic">"{comment.text}"</p>
                              <p className="text-[10px] font-mono text-[var(--color-muted)] mt-2">{new Date(comment.createdAt).toLocaleDateString('en-GB')}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] font-sans italic text-center py-10">This user hasn't posted anything yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-elevated)]/30 flex items-center justify-between gap-4">
          <p className="text-xs font-mono text-[var(--color-muted)]">
            ID: <span className="opacity-50">{userId.substring(0, 12)}...</span>
          </p>
          <button 
            onClick={handleModeration}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-sans text-sm font-bold transition-all duration-300 active:scale-95 shadow-lg ${
              userData?.isBanned 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
            }`}
          >
            {userData?.isBanned ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            {userData?.isBanned ? 'Lift Suspension' : 'Suspend User'}
          </button>
        </div>
      </div>
    </div>
  );
}
