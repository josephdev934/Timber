import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface ManageMembersModalProps {
  chatId: string;
  mode: "add" | "remove" | "view";
  currentParticipants: User[];
  onClose: () => void;
  onUpdate: () => void;
  adminId?: string;
}

export default function ManageMembersModal({ chatId, mode, currentParticipants, onClose, onUpdate, adminId }: ManageMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (mode === "remove" || mode === "view") {
      // Show participants (filter self out only for remove mode if desired, but for view we show all)
      setSearchResults(mode === "remove" ? currentParticipants.filter(p => p.id !== currentUser?.id) : currentParticipants);
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem("timber_token");
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter out users already in the group
          const filtered = data.filter((u: User) => 
            !currentParticipants.find(p => p.id === u.id) && 
            u.id !== currentUser?.id
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, mode, currentParticipants, currentUser]);

  const sortedResults = [...searchResults].sort((a, b) => {
    if (a.id === adminId) return -1;
    if (b.id === adminId) return 1;
    return 0;
  });

  const handleAction = async (userId: string) => {
    if (mode === "view") return;
    setProcessingId(userId);
    setError(null);
    try {
      const token = localStorage.getItem("timber_token");
      const url = `/api/chats/${chatId}/members${mode === "remove" ? `?userId=${userId}` : ""}`;
      const method = mode === "add" ? "POST" : "DELETE";
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: mode === "add" ? JSON.stringify({ userId }) : undefined
      });
      
      if (res.ok) {
        onUpdate();
        if (mode === "add") {
          setSearchQuery("");
          setSearchResults(prev => prev.filter(u => u.id !== userId));
        }
      } else {
        const data = await res.json();
        setError(data.error || "Action failed");
      }
    } catch (err) {
      console.error("Member action failed", err);
      setError("Connection error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[#F2EEE9] flex items-center justify-between">
          <h3 className="font-bold text-[#4B3B2B] text-lg">
            {mode === "add" ? "Add Member" : mode === "remove" ? "Remove Member" : "Group Members"}
          </h3>
          <button onClick={onClose} className="text-[#A19181] hover:text-[#4B3B2B]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mode === "add" && (
          <div className="p-4 border-b border-[#F2EEE9]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full bg-[#F9F7F5] border border-[#F2EEE9] rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#775839]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <svg className="absolute left-3 top-3.5 w-4 h-4 text-[#A19181]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-50 text-red-500 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="flex-grow overflow-y-auto p-2">
          {sortedResults.map(user => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F7F5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <img src={user.avatar || undefined} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#4B3B2B] text-sm">{user.name}</p>
                    {user.id === adminId && (
                      <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Group Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A19181]">@{user.username}</p>
                </div>
              </div>
              {mode !== "view" && (
                <button 
                  onClick={() => handleAction(user.id)}
                  disabled={!!processingId}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    mode === "add" 
                      ? "bg-[#775839] text-white hover:bg-[#5C4229]" 
                      : "bg-red-50 text-red-500 hover:bg-red-100"
                  }`}
                >
                  {processingId === user.id ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {mode === "add" ? "Adding" : "Removing"}
                    </span>
                  ) : (
                    mode === "add" ? "Add" : "Remove"
                  )}
                </button>
              )}
            </div>
          ))}
          {mode === "add" && searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="p-8 text-center text-[#A19181] text-sm italic">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
