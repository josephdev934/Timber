import React, { useState, useEffect } from "react";
import ChatItem from "./ChatItem";
import ChatFilters from "./ChatFilters";
import NewGroupModal from "./NewGroupModal";
import { socketClient } from "@/infrastructure/socket/socketClient";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isGroup: boolean;
  groupPhoto: string;
}

interface ChatListProps {
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
}

/**
 * ==========================================
 * COMPONENT: ChatList
 * ==========================================
 */
export default function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const selectedChatIdRef = React.useRef(selectedChatId);
  
  React.useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("timber_token");
      if (!token) return;

      const res = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch chats");
      
      const data = await res.json();
      const updatedChats = Array.isArray(data) ? data.map((chat: Chat) => ({
        ...chat,
        unreadCount: chat.id === selectedChatIdRef.current ? 0 : chat.unreadCount
      })) : [];
      setChats(updatedChats);
    } catch (err) {
      console.error("[CHAT_LIST_FETCH_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    const socket = socketClient.getInstance();
    const handleNewMessage = () => fetchChats();
    socket.on("MESSAGE_CREATED", handleNewMessage);
    socket.on("MESSAGES_READ", (payload: any) => {
      if (payload.chatId) {
        setChats(prev => prev.map(chat => 
          chat.id === payload.chatId ? { ...chat, unreadCount: 0 } : chat
        ));
      }
    });

    socket.on("presence:update", (payload: any) => {
      fetchChats(); 
    });

    socket.on("GROUP_PHOTO_UPDATED", (payload: any) => {
      setChats(prev => prev.map(chat => 
        chat.id === payload.chatId ? { ...chat, groupPhoto: payload.groupPhoto } : chat
      ));
    });

    return () => {
      socket.off("MESSAGE_CREATED", handleNewMessage);
      socket.off("MESSAGES_READ");
      socket.off("presence:update");
      socket.off("GROUP_PHOTO_UPDATED");
    };
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      setChats(prev => prev.map(chat => 
        chat.id === selectedChatId ? { ...chat, unreadCount: 0 } : chat
      ));
    }
  }, [selectedChatId]);

  const filteredChats = chats.filter((chat) => {
    if (searchQuery && !chat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeFilter === "unread") return chat.unreadCount > 0;
    if (activeFilter === "groups") return chat.isGroup;
    return true;
  });

  const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount > 0 ? 1 : 0), 0);

  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const token = localStorage.getItem("timber_token");
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data);
        }
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const startPrivateChat = async (userId: string) => {
    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch("/api/chats/private", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const conversation = await res.json();
        setSearchQuery("");
        setUserSearchResults([]);
        onSelectChat(conversation._id);
        fetchChats();
      }
    } catch (err) {
      console.error("Failed to start private chat", err);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-surface relative">
      {/* Header */}
      <div className="p-4 border-b border-timber-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search chats or users..."
              className="w-full bg-timber-input-bg border-none text-timber-text placeholder-timber-placeholder rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-1 focus:ring-timber-brand transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute left-3 top-3.5 w-4 h-4 text-timber-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Search Dropdown */}
            {searchQuery.trim() && userSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl shadow-xl border border-timber-border z-50 overflow-hidden">
                <div className="px-4 py-2 text-xs font-bold text-timber-muted uppercase tracking-wider bg-elevated">
                  Start a New Chat
                </div>
                {userSearchResults.map(user => (
                  <div 
                    key={user.id} 
                    onClick={() => startPrivateChat(user.id)}
                    className="flex items-center gap-3 p-3 hover:bg-elevated cursor-pointer transition-colors"
                  >
                    <img src={user.avatar || undefined} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-elevated" />
                    <div>
                      <p className="font-bold text-timber-text text-sm">{user.name}</p>
                      <p className="text-xs text-timber-muted">{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* New Group Button */}
          <button 
            className="flex-shrink-0 w-11 h-11 bg-timber-input-bg rounded-full flex items-center justify-center text-timber-brand hover:bg-elevated transition-colors"
            title="Create New Group"
            onClick={() => setIsGroupModalOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <ChatFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
          unreadCount={totalUnread}
        />
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto pb-24">
        {loading ? (
          <div className="p-10 text-center animate-pulse text-timber-muted font-bold tracking-widest uppercase text-[10px]">
             Syncing conversations...
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ChatItem
              key={chat.id}
              {...chat}
              isActive={selectedChatId === chat.id}
              onSelect={onSelectChat}
            />
          ))
        ) : (
          <div className="p-20 text-center">
             <p className="text-timber-muted text-sm italic">No chats found.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile only) */}
      <button 
        className="md:hidden absolute bottom-20 right-6 w-14 h-14 bg-timber-btn-bg text-timber-btn-text rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        onClick={() => setIsGroupModalOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {isGroupModalOpen && (
        <NewGroupModal 
          onClose={() => setIsGroupModalOpen(false)} 
          onGroupCreated={(chatId) => {
            setIsGroupModalOpen(false);
            onSelectChat(chatId);
            fetchChats();
          }} 
        />
      )}
    </div>
  );
}
