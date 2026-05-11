import React from "react";
import ChatLayout from "@/components/chat/ChatLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

/**
 * ==========================================
 * PAGE: Messages
 * ==========================================
 * Main entry point for the Timber Messaging UI.
 */
export default function MessagesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-page overflow-x-hidden">
      <Header />

      {/* Main Chat Interface */}
      <main className="flex-grow pb-20 md:pb-0">
        <ChatLayout />
      </main>

      <BottomNav />
    </div>
  );
}
