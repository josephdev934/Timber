import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface NewGroupModalProps {
  onClose: () => void;
  onGroupCreated: (chatId: string) => void;
}

export default function NewGroupModal({ onClose, onGroupCreated }: NewGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
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
          // Filter out already selected users AND the current user
          const filtered = data.filter((u: User) => 
            !selectedUsers.find(su => su.id === u.id) && 
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
  }, [searchQuery, selectedUsers]);

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      if (prev.find(u => u.id === user.id)) {
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select at least one other member.");
      return;
    }
    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }
    
    setError(null);
    setIsCreating(true);
    try {
      const token = localStorage.getItem("timber_token");
      const participantIds = selectedUsers.map(u => u.id);
      
      const res = await fetch("/api/chats/group", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ participantIds, name: groupName.trim() })
      });
      
      if (res.ok) {
        const conversation = await res.json();
        onGroupCreated(conversation._id || conversation.id);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create group");
      }
    } catch (err) {
      console.error("Failed to create group", err);
      setError("Connection error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#F2EEE9] flex items-center justify-between">
          <h3 className="font-bold text-[#4B3B2B] text-lg">New Group Chat</h3>
          <button onClick={onClose} className="text-[#A19181] hover:text-[#4B3B2B]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Group Name Input */}
        <div className="px-4 pt-4">
          <label className="block text-xs font-bold text-[#A19181] uppercase tracking-wider mb-2">Group Name *</label>
          <input
            type="text"
            placeholder="e.g. Project Team, Family, Squad..."
            className="w-full bg-[#F9F7F5] border border-[#F2EEE9] rounded-2xl py-3 px-4 text-sm focus:ring-1 focus:ring-[#775839] placeholder:text-[#C5BAB0]"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-xs text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Selected Users Chips */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-[#F2EEE9] flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {selectedUsers.map(user => (
              <div key={user.id} className="bg-[#F9F7F5] rounded-full pl-2 pr-3 py-1 flex items-center gap-2 border border-[#E8E3DD]">
                <img src={user.avatar || undefined} className="w-5 h-5 rounded-full object-cover" />
                <span className="text-xs font-bold text-[#4B3B2B]">{user.name}</span>
                <button onClick={() => toggleUserSelection(user)} className="text-[#A19181] hover:text-red-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users to add..."
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

        {/* Results List */}
        <div className="flex-grow overflow-y-auto p-2">
          {searchResults.map(user => (
            <div 
              key={user.id} 
              onClick={() => toggleUserSelection(user)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F9F7F5] cursor-pointer transition-colors"
            >
              <img src={user.avatar || undefined} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
              <div>
                <p className="font-bold text-[#4B3B2B] text-sm">{user.name}</p>
                <p className="text-xs text-[#A19181]">@{user.username}</p>
              </div>
            </div>
          ))}
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="p-4 text-center text-[#A19181] text-sm">No users found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F2EEE9]">
          <button 
            onClick={handleCreateGroup}
            disabled={selectedUsers.length === 0 || !groupName.trim() || isCreating}
            className={`w-full py-3 rounded-2xl font-bold text-white transition-colors ${
              selectedUsers.length > 0 && groupName.trim() && !isCreating ? 'bg-[#775839] hover:bg-[#5C4229]' : 'bg-[#D1C7BD] cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Creating...' : `Create Group (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
