"use client";

import React, { useState } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

/**
 * ==========================================
 * COMPONENT: ChatLayout
 * ==========================================
 * Manages the responsive split/stacked layout.
 * Desktop: Sidebar (List) + Main (Chat)
 * Mobile: Toggles between List and Chat.
 */
export default function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-page overflow-hidden">
      {/* Sidebar / Chat List */}
      <div 
        className={`w-full md:w-[380px] border-r border-timber-border flex-shrink-0 transition-all duration-300 ${
          selectedChatId ? "hidden md:flex" : "flex"
        }`}
      >
        <ChatList 
          selectedChatId={selectedChatId} 
          onSelectChat={setSelectedChatId} 
        />
      </div>

      {/* Main Chat Window */}
      <div 
        className={`flex-grow bg-surface transition-all duration-300 ${
          !selectedChatId ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedChatId ? (
          <ChatWindow 
            chatId={selectedChatId} 
            onBack={() => setSelectedChatId(null)} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-timber-muted">
             <div className="bg-elevated p-6 rounded-full mb-4 border border-timber-border">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
             </div>
             <p className="text-lg font-bold tracking-tight">Syncing your conversations...</p>
             <p className="text-xs font-medium uppercase tracking-[0.2em] mt-2 opacity-60">Select a chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
