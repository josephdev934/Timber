import React, { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { socketClient } from "@/infrastructure/socket/socketClient";
import { useAuth } from "@/context/AuthContext";
import ManageMembersModal from "./ManageMembersModal";
import ReportModal from "./ReportModal";

interface Message {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
  isRead: boolean;
  senderName?: string;
  isSystemMessage?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  senderId?: string;
}

interface ChatMetadata {
  id: string;
  name: string;
  groupPhoto: string;
  isGroup: boolean;
  canDelete: boolean;
  isOwner: boolean;
  createdBy?: string;
  isOnline: boolean;
  isActiveParticipant: boolean;
  participants: any[];
}

interface ChatWindowProps {
  chatId: string;
  onBack: () => void;
}

/**
 * ==========================================
 * COMPONENT: ChatWindow
 * ==========================================
 */
export default function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<{ id: string, text: string, senderName: string } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string, text: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMeta, setChatMeta] = useState<ChatMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [memberModalMode, setMemberModalMode] = useState<"add" | "remove" | "view" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chatUploadProgress, setChatUploadProgress] = useState<number | null>(null);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    targetId: string;
    targetType: 'User' | 'Group' | 'Message' | 'Post' | 'Comment';
    targetName: string;
    reportedUserId: string;
  }>({
    isOpen: false,
    targetId: '',
    targetType: 'User',
    targetName: '',
    reportedUserId: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const groupPhotoInputRef = useRef<HTMLInputElement>(null);
  const [groupPhotoUploading, setGroupPhotoUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handleDeleteChat = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${chatMeta?.isGroup ? 'group' : 'chat'}?`)) return;
    try {
      const token = localStorage.getItem("timber_token");
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onBack();
      }
    } catch (err) {
      console.error("[CHAT_DELETE_FAILED]", err);
    }
  };


  const fetchData = async () => {
    try {
      const token = localStorage.getItem("timber_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [metaRes, msgRes] = await Promise.all([
        fetch(`/api/chats/${chatId}`, { headers }),
        fetch(`/api/messages/chat/${chatId}`, { headers })
      ]);

      if (metaRes.ok) setChatMeta(await metaRes.json());
      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(data.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: msg.senderId === user?.id,
          isRead: true,
          senderName: msg.sender?.name || msg.sender?.username || "Unknown",
          isSystemMessage: msg.isSystemMessage,
          replyTo: msg.replyTo,
          mediaUrl: msg.mediaUrl,
          mediaType: msg.mediaType,
          senderId: msg.senderId
        })));
      }
    } catch (err) {
      console.error("[CHAT_WINDOW_FETCH_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chatId || !user) return;
    
    const token = localStorage.getItem("timber_token");
    fetch(`/api/messages/chat/${chatId}/read`, { 
      method: "PATCH", 
      headers: { Authorization: `Bearer ${token}` } 
    });

    fetchData();

    const socket = socketClient.getInstance();
    socketClient.joinChat(chatId);

    const handleNewMessage = (payload: any) => {
      if (payload.chatId === chatId) {
        const incomingMsg: any = {
          id: payload.messageId,
          text: payload.text,
          time: new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: payload.senderId === user.id,
          isRead: true,
          senderName: payload.senderName,
          isSystemMessage: payload.isSystemMessage,
          replyTo: payload.replyTo,
          mediaUrl: payload.mediaUrl,
          mediaType: payload.mediaType,
          senderId: payload.senderId
        };
        setMessages(prev => [...prev, incomingMsg]);

        if (payload.senderId !== user.id) {
          const token = localStorage.getItem("timber_token");
          fetch(`/api/messages/chat/${chatId}/read`, { 
            method: "PATCH", 
            headers: { Authorization: `Bearer ${token}` } 
          });
        }
      }
    };

    const handleMessageUpdated = (payload: any) => {
      if (payload.chatId === chatId) {
        setMessages(prev => prev.map(msg => 
          msg.id === payload.messageId ? { ...msg, text: payload.text } : msg
        ));
      }
    };

    const handleMessageDeleted = (payload: any) => {
      if (payload.chatId === chatId) {
        setMessages(prev => prev.filter(msg => msg.id !== payload.messageId));
      }
    };

    socket.on("MESSAGE_CREATED", handleNewMessage);
    socket.on("MESSAGE_UPDATED", handleMessageUpdated);
    socket.on("MESSAGE_DELETED", handleMessageDeleted);

    const handleTyping = (payload: any) => {
      if (payload.chatId === chatId && payload.userId !== user.id) {
        setIsRemoteTyping(payload.isTyping);
        if (payload.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsRemoteTyping(false), 5000);
        }
      }
    };
    socket.on("chat:typing", handleTyping);

    const handleChatUpdate = () => fetchData();
    socket.on("CHAT_UPDATED", handleChatUpdate);
    
    const handleGroupPhotoUpdated = (payload: any) => {
      if (payload.chatId === chatId) {
        setChatMeta(prev => prev ? { ...prev, groupPhoto: payload.groupPhoto } : null);
      }
    };
    socket.on("GROUP_PHOTO_UPDATED", handleGroupPhotoUpdated);
 
    return () => {
      socket.off("MESSAGE_CREATED", handleNewMessage);
      socket.off("MESSAGE_UPDATED", handleMessageUpdated);
      socket.off("MESSAGE_DELETED", handleMessageDeleted);
      socket.off("chat:typing", handleTyping);
      socket.off("CHAT_UPDATED", handleChatUpdate);
      socket.off("GROUP_PHOTO_UPDATED", handleGroupPhotoUpdated);
      socketClient.leaveRoom(`chat:${chatId}`);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, user]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset || "");
    
    try {
      return await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setChatUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } else {
            reject(new Error("Cloudinary upload failed"));
          }
        };
        
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });
    } catch (err) {
      throw err;
    } finally {
      setChatUploadProgress(null);
    }
  };

  const handleGroupPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Max 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewPhoto(event.target?.result as string);
      setPreviewFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPhotoUpload = async () => {
    if (!previewFile) return;
    
    setGroupPhotoUploading(true);
    setPreviewPhoto(null);
    try {
      const url = await uploadToCloudinary(previewFile);
      const token = localStorage.getItem("timber_token");
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ groupPhoto: url })
      });
      
      const resData = await res.json();
      if (resData.success && resData.groupPhoto) {
        setChatMeta(prev => prev ? { ...prev, groupPhoto: resData.groupPhoto } : null);
      }
      
      // No immediate fetchData() here to avoid race conditions with DB persistence
      // The socket event will trigger a refresh if needed for others.
      // We also trigger a small delay then refresh to be safe.
      setTimeout(fetchData, 1000);
    } catch (err) {
      console.error("[GROUP_PHOTO_UPDATE_FAILED]", err);
      alert("Failed to update group photo");
    } finally {
      setGroupPhotoUploading(false);
      setPreviewFile(null);
    }
  };

  const handleSend = async (text: string, replyToId?: string) => {
    if (!user) return;
    try {
      let mediaUrl = undefined;
      let mediaType = undefined;

      if (selectedFile) {
        mediaUrl = await uploadToCloudinary(selectedFile);
        mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
        setSelectedFile(null);
      }

      const token = localStorage.getItem("timber_token");
      const msgBody = {
        chatId,
        text,
        replyTo: replyToId,
        mediaUrl,
        mediaType
      };
      console.log("[ChatWindow_API_POST]", msgBody);

      await fetch("/api/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(msgBody),
      });
      setReplyingTo(null);
    } catch (err) {
      console.error("[CHAT_SEND_FAILED]", err);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleEdit = async (id: string, text: string) => {
    try {
      const token = localStorage.getItem("timber_token");
      await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text }),
      });
      setEditingMessage(null);
    } catch (err) {
      console.error("[CHAT_EDIT_FAILED]", err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const token = localStorage.getItem("timber_token");
      await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("[CHAT_DELETE_MSG_FAILED]", err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTyping = () => {
    if (!user) return;
    const socket = socketClient.getInstance();
    socket.emit("chat:typing", { chatId, userId: user.id, isTyping: true });
  };

  return (
    <div className="flex flex-col w-full h-full bg-page">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-md border-b border-timber-border sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-timber-brand">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative group/avatar">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-timber-brand/20 bg-elevated transition-all ${groupPhotoUploading ? 'opacity-50' : ''}`}>
              <img src={chatMeta?.groupPhoto || "/default-avatar.svg"} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            {chatMeta?.isGroup && chatMeta?.isOwner && (
              <button 
                onClick={() => groupPhotoInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-5 h-5 bg-timber-brand text-white rounded-full flex items-center justify-center shadow-lg border-2 border-surface hover:scale-110 transition-transform z-20"
                title="Change Group Photo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </button>
            )}
            {chatMeta?.isOnline && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-surface rounded-full shadow-sm z-10"></div>
            )}
            <input 
              type="file" 
              ref={groupPhotoInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleGroupPhotoChange}
            />
          </div>
          
          <div>
            <h3 className="font-semibold text-timber-text leading-tight">
              {chatMeta ? chatMeta.name : 'Syncing...'}
            </h3>
            {chatMeta?.isOnline && (
              <p className="text-[11px] text-[#4ADE80] font-bold tracking-widest uppercase mt-0.5">Online</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2.5 rounded-full text-timber-brand hover:bg-elevated transition-all active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-[80]" 
                onClick={() => setShowMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-2xl shadow-xl border border-timber-border py-2 z-[90] animate-in fade-in zoom-in duration-200">
                <button className="w-full px-4 py-2.5 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3">
                  <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video Call
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3">
                  <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Voice Call
                </button>
                
                {chatMeta?.isGroup && (
                  <>
                    <div className="h-[1px] bg-timber-border my-1"></div>
                    <button 
                      onClick={() => { setMemberModalMode("view"); setShowMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      View Members
                    </button>
                  </>
                )}
                
                {chatMeta?.isGroup && chatMeta?.isOwner && (
                  <>
                    <button 
                      onClick={() => { groupPhotoInputRef.current?.click(); setShowMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Change Group Photo
                    </button>
                    <button 
                      onClick={() => { setMemberModalMode("add"); setShowMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Add Member
                    </button>
                    <button 
                      onClick={() => { setMemberModalMode("remove"); setShowMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-timber-text hover:bg-elevated flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-timber-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12H15" />
                      </svg>
                      Remove Member
                    </button>
                  </>
                )}

                {chatMeta?.canDelete && (
                  <>
                    <div className="h-[1px] bg-timber-border my-1"></div>
                    <button 
                      onClick={() => { handleDeleteChat(); setShowMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {chatMeta.isGroup ? "Delete Group" : "Delete Chat"}
                    </button>
                  </>
                )}

                <div className="h-[1px] bg-timber-border my-1"></div>
                <button 
                  onClick={() => {
                    const otherUser = chatMeta?.participants.find(p => (p._id?.toString() || p.id?.toString()) !== user?.id);
                    if (otherUser) {
                      const otherUserId = otherUser._id?.toString() || otherUser.id?.toString();
                      setReportModal({
                        isOpen: true,
                        targetId: otherUserId,
                        targetType: 'User',
                        targetName: otherUser.name || otherUser.username,
                        reportedUserId: otherUserId
                      });
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50/5 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Report User
                </button>
                {chatMeta?.isGroup && (
                  <button 
                    onClick={() => {
                      setReportModal({
                        isOpen: true,
                        targetId: chatMeta.id,
                        targetType: 'Group',
                        targetName: chatMeta.name,
                        reportedUserId: chatMeta.createdBy || chatMeta.participants[0]?._id || chatMeta.participants[0]?.id || ""
                      });
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50/5 flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Report Group
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ReportModal 
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
        targetId={reportModal.targetId}
        targetType={reportModal.targetType}
        targetName={reportModal.targetName}
        reportedUserId={reportModal.reportedUserId}
      />

      {memberModalMode && chatMeta && (
        <ManageMembersModal
          chatId={chatId}
          mode={memberModalMode}
          currentParticipants={chatMeta.participants}
          adminId={chatMeta.createdBy}
          onClose={() => setMemberModalMode(null)}
          onUpdate={() => { fetchData(); setMemberModalMode(null); }}
        />
      )}

      {previewPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-timber-border animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <h3 className="text-xl font-bold text-timber-text mb-2">Update Group Photo</h3>
              <p className="text-timber-muted text-sm mb-6">Preview your new group profile picture</p>
              
              <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-timber-brand shadow-xl mb-8">
                <img src={previewPhoto} className="w-full h-full object-cover" alt="Preview" />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => { setPreviewPhoto(null); setPreviewFile(null); }}
                  className="flex-1 py-4 px-6 rounded-2xl font-bold text-timber-muted hover:bg-elevated transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmPhotoUpload}
                  className="flex-1 py-4 px-6 rounded-2xl font-bold bg-timber-brand text-white shadow-lg shadow-timber-brand/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto overflow-x-hidden p-6 pb-40 space-y-2 bg-page"
      >
        <div className="flex justify-center mb-8">
           <span className="px-4 py-1.5 bg-elevated text-timber-muted text-[10px] font-bold uppercase tracking-widest rounded-full border border-timber-border">
              Today
           </span>
        </div>
        
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            {...msg} 
            showSenderName={chatMeta?.isGroup}
            onReply={setReplyingTo}
            onEdit={setEditingMessage}
            onDelete={handleDeleteMessage}
            onReport={(id, text, sId) => {
              setReportModal({
                isOpen: true,
                targetId: id,
                targetType: 'Message',
                targetName: text.length > 20 ? text.substring(0, 20) + '...' : text,
                reportedUserId: sId
              });
            }}
          />
        ))}
        
        {/* Typing Indicator */}
        {isRemoteTyping && (
          <div className="flex items-center gap-1.5 px-4 py-3 bg-surface border border-timber-border rounded-2xl rounded-bl-none shadow-sm w-fit mt-4">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-timber-placeholder rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-timber-placeholder rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-timber-placeholder rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-page sticky bottom-20 z-20 border-t border-timber-border">
        {chatMeta?.isGroup && !chatMeta?.isActiveParticipant ? (
          <div className="text-center py-4 px-6 bg-elevated border border-timber-border rounded-2xl">
            <p className="text-sm font-bold text-timber-muted tracking-widest uppercase">
              Archived Group
            </p>
          </div>
        ) : (
          <MessageInput 
            onSend={handleSend} 
            onEdit={handleEdit}
            onTyping={handleTyping}
            replyingTo={replyingTo}
            editingMessage={editingMessage}
            onCancel={() => { setReplyingTo(null); setEditingMessage(null); }}
            participants={chatMeta?.participants}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            uploadProgress={chatUploadProgress}
          />
        )}
      </div>
    </div>
  );
}
