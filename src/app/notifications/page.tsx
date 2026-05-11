"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import NotificationItem from "@/components/notifications/NotificationItem";
import { socketClient } from "@/infrastructure/socket/socketClient";

/**
 * ==========================================
 * PAGE: Notifications
 * ==========================================
 */
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const LIMIT = 20;

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      const token = localStorage.getItem("timber_token");
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        window.dispatchEvent(new CustomEvent('notifications:clear'));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const fetchNotifications = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const token = localStorage.getItem("timber_token");
      const currentOffset = isLoadMore ? offset + LIMIT : 0;
      const res = await fetch(`/api/notifications?limit=${LIMIT}&offset=${currentOffset}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.notifications) {
        const newBatch = data.notifications;
        const updatedList = isLoadMore ? [...notifications, ...newBatch] : newBatch;
        setNotifications(updatedList);
        setHasMore(newBatch.length === LIMIT);
        if (isLoadMore) setOffset(currentOffset);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = socketClient.getInstance();
    socket.on("notification:new", (payload: any) => {
      fetchNotifications(false);
    });
    
    return () => {
      socket.off("notification:new");
    };
  }, []);

  // Compute groups from flat list
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const grouped: { [key: string]: any[] } = { "TODAY": [], "YESTERDAY": [], "OLDER": [] };
  notifications.forEach((n: any) => {
    const nDate = new Date(n.createdAt);
    if (nDate.toDateString() === today.toDateString()) grouped["TODAY"].push(n);
    else if (nDate.toDateString() === yesterday.toDateString()) grouped["YESTERDAY"].push(n);
    else grouped["OLDER"].push(n);
  });

  const groups = Object.entries(grouped)
    .filter(([_, items]) => items.length > 0)
    .map(([section, items]) => ({ section, items }));

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Header />

      <main className="flex-grow max-w-2xl mx-auto w-full pb-24">
        <div className="p-6">
          <h1 className="text-4xl font-bold text-timber-text mb-2 tracking-tight">Activity</h1>
          <div className="flex justify-between items-end">
            <p className="text-timber-muted text-sm font-medium">Stay updated with your team's movements.</p>
            {notifications.some(n => !n.isRead) && (
              <button 
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="px-4 py-1.5 bg-timber-btn-bg text-timber-btn-text text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-timber-brand/90 transition-all shadow-sm disabled:opacity-50 active:scale-95"
              >
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-timber-muted animate-pulse font-bold tracking-widest uppercase text-xs">
            Syncing your activity...
          </div>
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.section} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-6 py-2 flex items-center gap-4">
                 <span className="text-[10px] font-bold text-timber-muted tracking-[0.2em] uppercase">{group.section}</span>
                 <div className="flex-grow h-[1px] bg-timber-border" />
              </div>
              
              <div className="bg-surface border-y border-timber-border md:rounded-3xl md:border md:mx-4 overflow-hidden shadow-sm">
                 {group.items.map((item) => (
                   <NotificationItem 
                     key={item.id} 
                     {...item} 
                     onDelete={handleDeleteNotification}
                   />
                 ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-elevated border border-timber-border rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📭</div>
            <p className="text-timber-muted text-sm italic">No activity yet. Your notifications will appear here.</p>
          </div>
        )}

        {hasMore && !loading && notifications.length > 0 && (
          <div className="px-6 pb-10">
            <button 
              onClick={() => fetchNotifications(true)}
              disabled={loadingMore}
              className="w-full py-4 bg-surface border border-timber-border rounded-2xl text-timber-brand font-bold text-xs uppercase tracking-widest hover:bg-elevated transition-colors disabled:opacity-50 active:scale-98"
            >
              {loadingMore ? "Loading..." : "Load More Activity"}
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
