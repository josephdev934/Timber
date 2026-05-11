"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostCard from "@/components/feed/PostCard";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

/**
 * ==========================================
 * PAGE: Profile
 * ==========================================
 */
export default function ProfilePage() {
  const { user, loading, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Settings States
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      try {
        const [postsRes, actsRes] = await Promise.all([
          fetch(`/api/users/${user.id}/posts`),
          fetch(`/api/users/${user.id}/activities`)
        ]);
        
        if (postsRes.ok) setPosts(await postsRes.json());
        if (actsRes.ok) setActivities(await actsRes.json());
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  const handleLikeUpdate = (postId: string, data: { likeCount: number; likedByCurrentUser: boolean }) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              likeCount: data.likeCount,
              likedByCurrentUser: data.likedByCurrentUser,
              stats: { ...post.stats, likes: data.likeCount }
            }
          : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch("/api/users/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.removeItem("timber_token");
        window.location.href = "/register";
      }
    } catch (err) {
      console.error("Account deletion failed", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-elevated rounded-full" />
          <div className="h-4 w-24 bg-elevated rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-page">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-elevated p-8 rounded-full mb-8">
            <svg className="w-16 h-16 text-timber-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-timber-text mb-4 tracking-tight">Your Identity Awaits</h2>
          <p className="text-timber-muted mb-10 max-w-xs leading-relaxed">Join the community to build your profile, track your interactions, and share your journey.</p>
          <div className="flex gap-4 w-full max-w-sm">
            <Link 
              href="/login" 
              className="flex-1 bg-timber-btn-bg text-timber-btn-text font-bold py-4 rounded-2xl shadow-lg shadow-timber-brand/30 active:scale-95 transition-transform text-center"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="flex-1 bg-surface border border-timber-border text-timber-brand font-bold py-4 rounded-2xl shadow-sm active:scale-95 transition-transform hover:bg-page text-center"
            >
              Register
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Header />

      <main className="flex-grow max-w-2xl mx-auto w-full pb-24 relative">
        <ProfileHeader 
          user={user} 
          stats={{ 
            posts: posts.length, 
            interactions: activities.length 
          }} 
          onPostsClick={() => setActiveTab("posts")}
          onInteractionsClick={() => setActiveTab("activity")}
          onEditClick={() => setIsEditModalOpen(true)}
        />

        {/* Action Buttons */}
        <div className="px-6 pb-6 bg-surface flex gap-4 justify-center">
           <button 
             onClick={() => setIsEditModalOpen(true)}
             className="flex-1 bg-timber-input-bg text-timber-text font-bold py-3 rounded-2xl text-sm hover:bg-elevated transition-colors shadow-sm active:scale-95"
           >
              Edit Profile
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-timber-border bg-surface sticky top-16 z-30">
          {["Posts", "Activity", "Settings"].map((tab) => {
            const id = tab.toLowerCase();
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 relative ${
                  isActive ? "text-timber-text" : "text-timber-muted hover:text-timber-text"
                }`}
              >
                {tab}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-timber-brand rounded-full animate-in fade-in duration-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4">
           {activeTab === "posts" && (
              dataLoading ? (
                <div className="flex flex-col gap-6 animate-pulse mt-4">
                   {[1, 2].map(i => (
                      <div key={i} className="bg-surface h-48 rounded-3xl border border-timber-border" />
                   ))}
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                   <PostCard 
                     key={post.id} 
                     {...post} 
                     onLikeUpdate={handleLikeUpdate}
                     onDelete={handlePostDelete}
                   />
                ))
              ) : (
                <div className="py-20 text-center text-timber-muted text-sm italic">
                   <p>No posts yet.</p>
                </div>
              )
           )}

           {activeTab === "activity" && (
              dataLoading ? (
                <div className="flex flex-col gap-4 animate-pulse mt-4">
                   {[1, 2, 3].map(i => (
                      <div key={i} className="bg-surface h-16 rounded-2xl border border-timber-border" />
                   ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="bg-surface p-5 border border-timber-border rounded-3xl flex gap-4 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-timber-input-bg flex-shrink-0 border border-timber-border">
                        <img 
                          src={user.profilePhoto || user.avatar || "/default-avatar.svg"} 
                          alt={user.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-grow flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-timber-text">
                            {user.name} <span className="text-timber-muted font-normal ml-1">@{user.username}</span>
                          </span>
                          <span className="text-[10px] text-timber-muted">{act.timestamp}</span>
                        </div>
                        <p className="text-[13px] text-timber-muted leading-relaxed">
                          <span className="text-timber-brand font-bold mr-1">Commented:</span>
                          "{act.text}"
                        </p>
                        <Link href={`/content/${act.contentId}`} className="text-[10px] font-bold text-timber-brand uppercase tracking-widest hover:underline mt-1">
                          View post
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-timber-muted text-sm italic">
                   <p>No recent activity to show.</p>
                </div>
              )
           )}

           {activeTab === "settings" && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="bg-surface rounded-[2rem] border border-timber-border overflow-hidden shadow-sm">
                 {/* Dark Mode Row */}
                 <div className="flex items-center justify-between p-5">
                   <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme === "dark" ? "bg-[#27211C] text-[#C4966A]" : "bg-[#F2EEE9] text-[#775839]"}`}>
                        {theme === "dark" ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                     </div>
                     <div>
                       <p className="text-[13px] font-medium text-timber-text leading-tight">Dark mode</p>
                       <p className="text-[11px] text-timber-muted">Switch appearance</p>
                     </div>
                   </div>
                   <button 
                    onClick={toggleTheme}
                    className={`relative w-10 h-[22px] rounded-full transition-colors duration-300 focus:outline-none ${theme === "dark" ? "bg-timber-brand" : "bg-[#D1C7BD]"}`}
                   >
                     <div className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform duration-300 ${theme === "dark" ? "translate-x-[18px]" : "translate-x-0"}`} />
                   </button>
                 </div>

                 <div className="h-[0.5px] bg-timber-border mx-5"></div>

                 {/* Logout Row */}
                 <button 
                  onClick={() => setShowLogoutSheet(true)}
                  className="w-full flex items-center justify-between p-5 hover:bg-elevated transition-colors text-left"
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme === "dark" ? "bg-[#412402] text-[#FAC775]" : "bg-[#FAEEDA] text-[#854F0B]"}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     </div>
                     <div>
                       <p className="text-[13px] font-medium text-timber-text leading-tight">Log out</p>
                       <p className="text-[11px] text-timber-muted">End your session</p>
                     </div>
                   </div>
                   <svg className="w-4 h-4 text-[#D1C7BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                 </button>

                 <div className="h-[0.5px] bg-timber-border mx-5"></div>

                 {/* Delete Row */}
                 <button 
                  onClick={() => setShowDeleteSheet(true)}
                  className="w-full flex items-center justify-between p-5 hover:bg-elevated transition-colors text-left"
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme === "dark" ? "bg-[#501313] text-[#F09595]" : "bg-[#FCEBEB] text-[#A32D2D]"}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </div>
                     <div>
                       <p className={`text-[13px] font-medium leading-tight ${theme === "dark" ? "text-[#F09595]" : "text-[#A32D2D]"}`}>Delete account</p>
                       <p className="text-[11px] text-timber-muted">Permanent, cannot be undone</p>
                     </div>
                   </div>
                   <svg className="w-4 h-4 text-[#D1C7BD]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                 </button>
               </div>
             </div>
           )}
        </div>
      </main>

      {/* Bottom Sheets */}
      <BottomSheet 
        isOpen={showLogoutSheet} 
        onClose={() => setShowLogoutSheet(false)}
      >
        <div className="p-8">
          <h2 className="text-base font-bold text-timber-text mb-1">Log out?</h2>
          <p className="text-[13px] text-timber-muted mb-8">You'll need to sign back in to access your account.</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { logout(); setShowLogoutSheet(false); }}
              className="w-full bg-[#775839] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#77583933] active:scale-95 transition-all"
            >
              Log out
            </button>
            <button 
              onClick={() => setShowLogoutSheet(false)}
              className="w-full bg-transparent text-timber-brand font-bold py-3 rounded-2xl active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet 
        isOpen={showDeleteSheet} 
        onClose={() => { setShowDeleteSheet(false); setDeleteInput(""); }}
      >
        <div className="p-8">
          <h2 className={`text-base font-bold mb-1 ${theme === "dark" ? "text-[#F09595]" : "text-[#A32D2D]"}`}>Delete your account?</h2>
          <p className="text-[13px] text-timber-muted mb-6 leading-relaxed">
            This will permanently delete your account and all your posts. This cannot be undone.
          </p>
          
          <input 
            type="text"
            placeholder="Type DELETE to confirm"
            className="w-full bg-timber-input-bg border border-timber-border rounded-2xl px-5 py-4 text-sm text-timber-text placeholder-timber-placeholder focus:ring-0 focus:border-timber-brand transition-all mb-6"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleDeleteAccount}
              disabled={deleteInput !== "DELETE"}
              className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg ${
                deleteInput === "DELETE" 
                ? theme === "dark" ? "bg-[#791F1F] text-white shadow-red-950/30" : "bg-[#A32D2D] text-white shadow-red-200/30"
                : "bg-timber-muted/20 text-timber-muted/50 cursor-not-allowed opacity-40 shadow-none"
              } active:scale-95`}
            >
              Delete account
            </button>
            <button 
              onClick={() => { setShowDeleteSheet(false); setDeleteInput(""); }}
              className="w-full bg-transparent text-timber-brand font-bold py-3 rounded-2xl active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomNav />

      {isEditModalOpen && (
        <EditProfileModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onUpdate={(updatedUser) => updateUser(updatedUser)}
        />
      )}
    </div>
  );
}

/**
 * ==========================================
 * SUB-COMPONENT: BottomSheet
 * ==========================================
 */
function BottomSheet({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
    else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-[#2C2420]/45 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div 
        className={`relative w-full max-w-2xl bg-surface rounded-t-[24px] shadow-2xl transition-transform duration-300 ease-out z-10 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-timber-border rounded-full mx-auto mt-3 opacity-50" />
        {children}
      </div>
    </div>
  );
}
