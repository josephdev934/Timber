import React, { useState, useEffect, useRef } from "react";

interface MessageInputProps {
  onSend: (text: string, replyToId?: string) => void;
  onEdit?: (id: string, text: string) => void;
  onTyping?: () => void;
  replyingTo?: { id: string; text: string; senderName: string } | null;
  editingMessage?: { id: string; text: string } | null;
  onCancel?: () => void;
  participants?: any[]; // For mentions
  onFileSelect?: (file: File | null) => void;
  uploadProgress?: number | null;
  selectedFile?: File | null;
}

export default function MessageInput({ 
  onSend, onEdit, onTyping, replyingTo, editingMessage, onCancel, participants = [],
  onFileSelect, uploadProgress, selectedFile
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      inputRef.current?.focus();
    } else if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [editingMessage, replyingTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    if (editingMessage) {
      onEdit?.(editingMessage.id, text);
    } else {
      onSend(text, replyingTo?.id);
    }
    
    setText("");
    onCancel?.();
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim()) onTyping?.();

    // Mention detection
    const lastAtPos = val.lastIndexOf("@");
    if (lastAtPos !== -1 && (lastAtPos === 0 || val[lastAtPos - 1] === " ")) {
      const query = val.substring(lastAtPos + 1);
      if (!query.includes(" ")) {
        setMentionFilter(query);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const filteredParticipants = (participants || []).filter(p => 
    p.username?.toLowerCase().includes(mentionFilter.toLowerCase()) ||
    p.name?.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const insertMention = (username: string) => {
    const lastAtPos = text.lastIndexOf("@");
    const newText = text.substring(0, lastAtPos) + "@" + username + " ";
    setText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > (file.type.startsWith('video') ? 100 : 10) * 1024 * 1024) {
      alert(`File is too large. Max ${file.type.startsWith('video') ? '100MB for video' : '10MB for images'}.`);
      return;
    }

    onFileSelect?.(file);
  };

  return (
    <div className="relative w-full">
      {/* Mention Suggestions */}
      {showMentions && filteredParticipants.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface border border-timber-border rounded-2xl shadow-xl z-20 py-2 max-h-48 overflow-y-auto">
          {filteredParticipants.map((p) => (
            <button
              key={p.id}
              onClick={() => insertMention(p.username)}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-elevated transition-colors text-left"
            >
              <img src={p.avatar} alt="" className="w-8 h-8 rounded-full bg-elevated" />
              <div>
                <p className="text-sm font-bold text-timber-text">{p.name || p.username}</p>
                <p className="text-xs text-timber-muted">@{p.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Media Preview */}
      {selectedFile && (
        <div className="mb-2 p-2 bg-elevated border border-timber-border rounded-2xl relative animate-in slide-in-from-bottom-2">
           <div className="flex items-center gap-3">
              <div className={`rounded-xl overflow-hidden border border-timber-border bg-black ${selectedFile.type.startsWith('video') ? 'w-[90px] h-[60px]' : 'w-[60px] h-[60px]'}`}>
                 {selectedFile.type.startsWith('video') ? (
                    <video src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" />
                 ) : (
                    <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" alt="Preview" />
                 )}
              </div>
               <div className="flex-grow">
                 <p className="text-[10px] font-bold text-timber-text truncate max-w-[150px]">{selectedFile.name}</p>
              </div>
              <button 
                onClick={() => onFileSelect?.(null)}
                className="p-1.5 bg-[#775839] text-white rounded-full hover:opacity-80 transition-opacity"
              >
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                 </svg>
              </button>
           </div>
        </div>
      )}

      {/* Reply/Edit Preview */}
      {(replyingTo || editingMessage) && (
        <div className="flex items-center justify-between px-4 py-3 bg-elevated border-x border-t border-timber-border rounded-t-2xl animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-1 h-8 bg-timber-brand rounded-full shrink-0"></div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-timber-brand uppercase tracking-widest">
                {editingMessage ? "Editing" : `Replying to ${replyingTo?.senderName}`}
              </p>
              <p className="text-sm text-timber-text truncate opacity-80">
                {editingMessage ? editingMessage.text : replyingTo?.text}
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-timber-brand/10 transition-colors"
          >
            <svg className="w-4 h-4 text-timber-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className={`flex items-center gap-3 p-4 bg-surface border border-timber-border shadow-sm transition-all ${
          replyingTo || editingMessage ? "rounded-b-2xl border-t-0" : "rounded-2xl"
        }`}
      >
        <input 
          type="file" 
          id="chat-media-picker" 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
          onChange={handleFileChange}
        />
        <button 
          type="button" 
          onClick={() => document.getElementById('chat-media-picker')?.click()}
          className="p-2.5 rounded-full bg-timber-input-bg text-timber-brand hover:bg-elevated transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            className="w-full bg-timber-input-bg border-none text-timber-text placeholder-timber-placeholder rounded-full py-3 px-6 text-sm focus:ring-1 focus:ring-timber-brand transition-all"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() && !selectedFile}
          className="p-3 rounded-full bg-timber-brand text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-timber-brand/90 transition-all duration-300 shadow-lg shadow-timber-brand/30 active:scale-95"
        >
          {editingMessage ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
