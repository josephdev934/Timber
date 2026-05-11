"use client";

import { useEffect, useState, useRef } from "react";
import { socketClient } from "@/infrastructure/socket/socketClient";

/**
 * ==========================================
 * TEST UI - PRIVATE MESSAGING
 * ==========================================
 * Minimal interface to verify real-time 1-1 chat.
 */
export default function ChatTestPage() {
  const [currentUserId, setCurrentUserId] = useState("user1");
  const [otherUserId, setOtherUserId] = useState("user2");
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Use ref to keep track of joined chat to avoid duplicate listeners or missed cleanup
  const currentChatIdRef = useRef("");

  useEffect(() => {
    // 1. Initialize Socket
    const socket = socketClient.getInstance();

    const onConnect = () => {
      console.log("[UI_SOCKET_CONNECTED]", socket.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.warn("[UI_SOCKET_DISCONNECTED]");
      setIsConnected(false);
    };

    const onMessageCreated = (payload: any) => {
      console.log("[UI_EVENT_RECEIVED] MESSAGE_CREATED", payload);
      setMessages((prev) => [...prev, payload]);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("MESSAGE_CREATED", onMessageCreated);

    // Initial state check
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("MESSAGE_CREATED", onMessageCreated);
    };
  }, []);

  /**
   * Join Chat Handler
   */
  const handleJoinChat = () => {
    if (!currentUserId || !otherUserId) return;

    // Generate Deterministic Chat ID: sort(userA, userB).join("_")
    const newChatId = [currentUserId, otherUserId].sort().join("_");
    
    // Cleanup previous room if any (Best effort)
    if (currentChatIdRef.current) {
      socketClient.leaveRoom(`chat:${currentChatIdRef.current}`);
    }

    setChatId(newChatId);
    currentChatIdRef.current = newChatId;
    setMessages([]); // Clear list for new chat

    // Emit join_chat through our utility
    socketClient.joinChat(newChatId);
    console.log(`[UI_JOIN_EMITTED] chatId: ${newChatId}`);
  };

  /**
   * Send Message Handler
   */
  const handleSendMessage = async () => {
    if (!message.trim() || !chatId) return;

    try {
      console.log("[UI_SEND_MESSAGE] Sending via API...");
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: otherUserId,
          text: message,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      setMessage(""); // Clear input
      console.log("[UI_SEND_SUCCESS]");
    } catch (err: any) {
      console.error("[UI_SEND_ERROR]", err.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>💬 Chat Real-Time Test</h1>
      
      <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <p>Status: <strong>{isConnected ? "✅ Connected" : "❌ Disconnected"}</strong></p>
        
        <label>My ID: </label>
        <input 
          value={currentUserId} 
          onChange={(e) => setCurrentUserId(e.target.value)} 
        />
        <br /><br />
        
        <label>Other User ID: </label>
        <input 
          value={otherUserId} 
          onChange={(e) => setOtherUserId(e.target.value)} 
        />
        <br /><br />
        
        <button onClick={handleJoinChat} style={{ padding: "5px 15px" }}>
          Join Chat
        </button>
      </div>

      {chatId && (
        <div style={{ border: "1px solid #ccc", padding: "10px" }}>
          <h3>Active Chat: <code>{chatId}</code></h3>
          
          <div style={{ 
            height: "200px", 
            overflowY: "scroll", 
            border: "1px solid #eee", 
            marginBottom: "10px",
            padding: "5px",
            background: "#f9f9f9"
          }}>
            {messages.length === 0 && <p style={{ color: "#999" }}>No messages yet...</p>}
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "5px" }}>
                <strong>{msg.senderId === currentUserId ? "Me" : "Them"}:</strong> {msg.text}
                <br />
                <small style={{ color: "#999" }}>{new Date(msg.createdAt).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>

          <input 
            style={{ width: "70%", padding: "5px" }}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage}
            style={{ padding: "5px 15px", marginLeft: "10px" }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
