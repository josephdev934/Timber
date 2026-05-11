"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PostCard from "@/components/feed/PostCard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * ==========================================
 * PAGE: Home Feed
 * ==========================================
 */
export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[FEED_FETCH_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePostClick = () => {
    if (user) {
      router.push("/create-post");
    } else {
      router.push("/register");
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Header />

      <main className="flex-grow max-w-2xl mx-auto w-full p-4 pb-24">
        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse mt-4">
             {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface h-48 rounded-3xl border border-timber-border" />
             ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              {...post} 
              onLikeUpdate={handleLikeUpdate}
              onDelete={handlePostDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-elevated p-6 rounded-full mb-6">
              <svg className="w-12 h-12 text-timber-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-timber-text mb-2">No posts yet</h3>
            <p className="text-timber-muted text-sm max-w-xs">Be the first to start a conversation in the Timber community.</p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={handleCreatePostClick}
        className="fixed bottom-24 right-6 w-14 h-14 bg-timber-btn-bg text-timber-btn-text rounded-full shadow-lg shadow-timber-brand/30 flex items-center justify-center z-40 group active:scale-95 transition-transform"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <BottomNav />
    </div>
  );
}
