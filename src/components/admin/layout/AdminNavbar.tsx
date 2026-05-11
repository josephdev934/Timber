"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Moon, Sun, Search, User, LogOut, Settings, X, History, Users, UsersRound, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { socketClient } from '@/infrastructure/socket/socketClient';

export function AdminNavbar() {
  const { admin, token, settings, loading, logout } = useAdmin();
  const router = useRouter();

  // State
  const [isDark, setIsDark] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeConnections, setActiveConnections] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifLoading, setIsNotifLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. AdminContext Token
  // Pull admin object and logout from AdminContext at the top
  // If context returns no token, call logout() immediately and redirect to /login
  useEffect(() => {
    if (!loading && !token) {
      logout();
      router.push('/login');
    }
  }, [loading, token, logout, router]);

  // 2. Live Online Count (Socket.IO)
  // On mount, initialize Socket.IO client connection
  // Join admin:stats room immediately after connection
  // Listen for STATS_UPDATE event → extract activeConnections field → store in state
  // On unmount → leave admin:stats room → remove STATS_UPDATE listener → disconnect socket
  useEffect(() => {
    if (!admin || !token) return;

    const socket = socketClient.getInstance();
    
    const handleConnect = () => {
      socketClient.joinRoom('admin:stats');
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const handleStatsUpdate = (data: any) => {
      if (data.activeConnections !== undefined) {
        setActiveConnections(data.activeConnections);
      }
    };

    socket.on('STATS_UPDATE', handleStatsUpdate);

    // 3. Aggressive Re-join (Ensures room membership persists)
    const joinInterval = setInterval(() => {
      if (socket.connected) {
        // We emit directly here to bypass the socketClient's local room cache
        // and ensure the server acknowledges the membership.
        socket.emit('join_room', 'admin:stats');
      }
    }, 10000);

    return () => {
      clearInterval(joinInterval);
      socket.off('connect', handleConnect);
      socketClient.leaveRoom('admin:stats');
      socket.off('STATS_UPDATE', handleStatsUpdate);
      // We don't fully disconnect the singleton socket here as it's used elsewhere,
      // but we remove all listeners and leave the room as requested for "zero dangling listeners".
    };
  }, [admin, token]);

  // 3. Notifications Bell
  // On mount → fetch GET /api/admin/notifications?unread=true with auth header
  // Store unreadCount in state — display as badge on bell icon
  // Socket listens for ADMIN_NOTIFICATION event → increment unreadCount by 1 in state
  // Bell icon click → open notifications dropdown → fire PATCH /api/admin/notifications/read-all
  useEffect(() => {
    if (!token) return;

    const fetchUnread = async () => {
      setIsNotifLoading(true);
      try {
        const res = await fetch('/api/admin/notifications?unread=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        } else {
          // Show error toast could be implemented with a toast library, 
          // for now we'll console error as per "do not crash"
          console.error("[NAVBAR_NOTIF_FETCH_FAILED] Status:", res.status);
        }
      } catch (err) {
        console.error("[NAVBAR_NOTIF_FETCH_FAILED]", err);
      } finally {
        setIsNotifLoading(false);
      }
    };

    fetchUnread();

    const socket = socketClient.getInstance();
    const handleNewNotif = () => {
      setUnreadCount(prev => prev + 1);
    };

    socket.on('ADMIN_NOTIFICATION', handleNewNotif);

    return () => {
      socket.off('ADMIN_NOTIFICATION', handleNewNotif);
    };
  }, [token]);

  const handleReadAll = async () => {
    if (!token) return;
    // Optimistic update
    const previousCount = unreadCount;
    setUnreadCount(0);

    try {
      const res = await fetch('/api/admin/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        setUnreadCount(previousCount);
        console.error("[NAVBAR_READ_ALL_FAILED] Status:", res.status);
      }
    } catch (err) {
      setUnreadCount(previousCount);
      console.error("[NAVBAR_READ_ALL_FAILED]", err);
    }
  };

  // 4. Global Search
  // useEffect on mount → attach keydown listener to window (Ctrl+K / Cmd+K)
  // Search input inside modal → debounce onChange by 300ms using useRef timer
  // After debounce → if query is not empty → GET /api/admin/search?q=<query> with auth header
  // Store results in state → render grouped by type
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Load recent searches
    const saved = localStorage.getItem('timber-admin-recent-searches');
    if (saved) setRecentSearches(JSON.parse(saved));

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        
        // Save to recent searches
        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('timber-admin-recent-searches', JSON.stringify(updated));
      }
    } catch (err) {
      console.error("[NAVBAR_SEARCH_FAILED]", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimer.current) clearTimeout(searchTimer.current);
    
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimer.current = setTimeout(() => {
      performSearch(val);
    }, 300);
  };

  const handleResultClick = (result: any) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(result.href);
  };

  // 5. Theme Toggle
  // On mount → read localStorage.getItem('timber-theme')
  // Toggle click → update document.documentElement class and localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('timber-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('timber-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('timber-theme', 'light');
    }
  };

  // 6. Admin Avatar Dropdown & Initials Fallback
  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // If AdminContext is still loading or admin is not resolved, we'll show a shell or return null
  // But the requirement says "Show isLoading spinner on avatar while AdminContext is still resolving"
  // So we handle it inside the return.

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-bg)]/70 backdrop-blur-md border-b border-[var(--color-border)] z-40 flex items-center justify-between px-6 transition-all duration-300">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3 w-[236px]">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-brand)] flex items-center justify-center">
            <span className="text-white font-bold text-lg font-sans leading-none">
              {settings?.general?.platformName?.[0] || 'T'}
            </span>
          </div>
          <span className="font-sans font-bold text-[var(--color-text)] text-lg tracking-tight truncate">
            {settings?.general?.platformName || 'Timber'}
          </span>
        </div>

        {/* Center: Search Trigger */}
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="flex-1 max-w-xl mx-4 relative hidden md:block cursor-pointer"
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[var(--color-muted)]" />
          </div>
          <div className="w-full h-10 pl-11 pr-16 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center text-[var(--color-muted)] text-sm font-sans transition-all duration-300 hover:bg-[var(--color-surface)]">
            Search systems...
          </div>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <span className="font-mono text-xs text-[var(--color-muted)] border border-[var(--color-border)] rounded px-1.5 py-0.5 bg-[var(--color-bg)]">⌘K</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Online Status */}
          <div className="hidden lg:flex items-center gap-2 mr-4 text-sm font-mono text-[var(--color-muted)]">
            <span className="relative flex h-2.5 w-2.5">
              {activeConnections > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeConnections > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
            </span>
            <span className="text-[var(--color-text)] font-mono font-bold tracking-tight">
              {activeConnections.toLocaleString()}
            </span> — online
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all duration-300 active:scale-95"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button 
            onClick={handleReadAll}
            className="relative p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-all duration-300 active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {isNotifLoading ? (
              <span className="absolute top-1.5 right-1.5 w-[12px] h-[12px] bg-[var(--color-border)] rounded-full animate-pulse" />
            ) : unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[12px] h-[12px] px-1 bg-red-500 rounded-full border border-[var(--color-bg)] text-[8px] font-bold text-white flex items-center justify-center animate-in fade-in zoom-in-50">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[var(--color-border)] mx-2"></div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={loading}
              className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-elevated)] transition-all duration-300 active:scale-95 disabled:opacity-50"
            >
              <span className="hidden sm:block text-sm font-medium font-sans text-[var(--color-text)] mr-1">
                {loading ? 'Loading...' : (admin?.name?.split(' ')[0] || 'Admin')}
              </span>
              
              <div className="relative w-8 h-8">
                {loading ? (
                  <div className="w-full h-full rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
                ) : admin?.profilePhoto ? (
                  <img src={admin.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white font-bold text-xs">
                    {admin ? getInitials(admin.name) : 'A'}
                  </div>
                )}
              </div>
            </button>

            {showDropdown && !loading && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-[var(--color-border)] mb-1">
                  <p className="text-sm font-bold font-sans text-[var(--color-text)]">{admin?.name}</p>
                  <p className="text-xs text-[var(--color-muted)] font-mono">{admin?.email}</p>
                </div>
                <button 
                  onClick={() => { router.push('/admin/settings'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-elevated)] flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button 
                  onClick={() => { logout(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Search Input */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-4">
              <Search className="w-6 h-6 text-[var(--color-muted)] ml-2" />
              <input 
                autoFocus
                type="text" 
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search everything..."
                className="flex-1 bg-transparent border-none outline-none text-xl font-sans text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--color-elevated)] text-[var(--color-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin">
              {!searchQuery.trim() ? (
                // Recent Searches
                <div className="space-y-4">
                  <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2">
                    <History className="w-3 h-3" /> Recent Searches
                  </h4>
                  {recentSearches.length > 0 ? (
                    <div className="space-y-1">
                      {recentSearches.map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => { setSearchQuery(s); performSearch(s); }}
                          className="w-full text-left px-4 py-3 rounded-2xl hover:bg-[var(--color-elevated)] text-sm font-sans text-[var(--color-text)] flex items-center justify-between group"
                        >
                          {s}
                          <span className="text-[10px] text-[var(--color-muted)] opacity-0 group-hover:opacity-100">Click to search</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-[var(--color-muted)] font-sans italic">
                      No recent searches. Start typing to find anything.
                    </p>
                  )}
                </div>
              ) : isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-sans text-[var(--color-muted)] animate-pulse">Searching the systems...</p>
                </div>
              ) : searchResults.length > 0 ? (
                // Grouped Results
                <div className="space-y-6 pb-4">
                  {['User', 'Group', 'Post', 'Comment'].map(type => {
                    const filtered = searchResults.filter(r => r.type === type);
                    if (filtered.length === 0) return null;
                    return (
                      <div key={type} className="space-y-2">
                        <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">{type}s</h4>
                        <div className="space-y-1">
                          {filtered.map(result => (
                            <button 
                              key={result.id}
                              onClick={() => handleResultClick(result)}
                              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-[var(--color-elevated)] transition-all group"
                            >
                              <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0 overflow-hidden text-[var(--color-brand)]">
                                {result.image ? (
                                  <img src={result.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  type === 'User' ? <Users className="w-5 h-5" /> :
                                  type === 'Group' ? <UsersRound className="w-5 h-5" /> :
                                  type === 'Post' ? <MessageSquare className="w-5 h-5" /> :
                                  <ImageIcon className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-bold font-sans text-[var(--color-text)] truncate group-hover:text-[var(--color-brand)] transition-colors">{result.title}</p>
                                <p className="text-xs font-mono text-[var(--color-muted)] truncate">{result.subtitle}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-[var(--color-muted)] font-sans">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[var(--color-elevated)]/30 border-t border-[var(--color-border)] flex justify-between items-center text-[10px] font-mono text-[var(--color-muted)]">
              <div className="flex gap-4">
                <span><span className="border border-[var(--color-border)] rounded px-1 py-0.5 mr-1 bg-[var(--color-bg)]">↵</span> Select</span>
                <span><span className="border border-[var(--color-border)] rounded px-1 py-0.5 mr-1 bg-[var(--color-bg)]">↑↓</span> Navigate</span>
              </div>
              <span><span className="border border-[var(--color-border)] rounded px-1 py-0.5 mr-1 bg-[var(--color-bg)]">ESC</span> Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
