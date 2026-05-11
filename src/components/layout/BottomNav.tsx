"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { socketClient } from "@/infrastructure/socket/socketClient";

/**
 * ==========================================
 * COMPONENT: BottomNav
 * ==========================================
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      socketClient.joinUser(user.id);
      
      // Fetch initial unread count
      const fetchUnread = async () => {
        try {
          const token = localStorage.getItem("timber_token");
          const res = await fetch("/api/notifications/unread", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.count || 0);
          }
        } catch (e) {}
      };
      fetchUnread();

      const socket = socketClient.getInstance();
      
      // Global Presence Heartbeat
      const heartbeat = setInterval(() => {
        socket.emit('presence:heartbeat', { userId: user.id });
      }, 30000); // Every 30s

      const handleNewNotif = () => setUnreadCount(prev => prev + 1);
      const handleReadNotif = () => setUnreadCount(prev => Math.max(0, prev - 1));
      const handleClearNotifs = () => setUnreadCount(0);

      socket.on('notification:new', handleNewNotif);
      window.addEventListener('notifications:read', handleReadNotif);
      window.addEventListener('notifications:clear', handleClearNotifs);
      
      return () => {
        clearInterval(heartbeat);
        socket.off('notification:new', handleNewNotif);
        window.removeEventListener('notifications:read', handleReadNotif);
        window.removeEventListener('notifications:clear', handleClearNotifs);
      };
    }
  }, [user?.id]);

  const navItems = [
    { label: "Home", href: "/", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { label: "Messages", href: "/messages", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )},
    { label: "Notifications", href: "/notifications", icon: (
      <div className="relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-timber-brand text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>
    )},
    { label: "Profile", href: "/profile", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-surface border-t border-timber-border flex items-center justify-around px-4 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 group transition-all duration-300 ${
              isActive ? "text-timber-brand" : "text-timber-muted hover:text-timber-brand"
            }`}
          >
            <div className={`transition-transform duration-300 group-active:scale-90 ${isActive ? "scale-110" : ""}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-60"}`}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-2 w-1 h-1 bg-timber-brand rounded-full"></div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
