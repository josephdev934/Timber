import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Terminal as TerminalIcon } from 'lucide-react';
import { socketClient } from '@/infrastructure/socket/socketClient';
import { useAdmin } from '@/context/AdminContext';

export function LiveEventLog() {
  const { token } = useAdmin();
  const [logs, setLogs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const bufferRef = useRef<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;

    const socket = socketClient.getInstance();

    const handleConnect = () => {
      socketClient.joinRoom('admin:events');
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const processEvent = (event: any) => {
      const logEntry = {
        time: new Date(event.timestamp || Date.now()).toLocaleTimeString([], { hour12: false }),
        type: event.eventName.replace('ADMIN:', '').substring(0, 8),
        subject: event.roomId,
        payload: JSON.stringify(event.payload || {}),
        raw: event
      };

      if (isPaused) {
        bufferRef.current.push(logEntry);
      } else {
        setLogs(prev => [...prev.slice(-99), logEntry]);
      }
    };

    socket.on('events:log', processEvent);
    socket.on('events:batch', (data: any) => {
      if (data.events) {
        data.events.forEach(processEvent);
      }
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('events:log', processEvent);
      socket.off('events:batch');
      socketClient.leaveRoom('admin:events');
    };
  }, [token, isPaused]);

  // Flush buffer when resuming
  useEffect(() => {
    if (!isPaused && bufferRef.current.length > 0) {
      setLogs(prev => [...prev.slice(-(100 - bufferRef.current.length)), ...bufferRef.current]);
      bufferRef.current = [];
    }
  }, [isPaused]);

  // Auto-scroll
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const clearLogs = () => {
    setLogs([]);
    bufferRef.current = [];
  };

  return (
    <div className="bg-[#1A1614] rounded-3xl border border-[var(--color-border)] overflow-hidden h-[500px] flex flex-col shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 font-sans ml-4">
            EVENT STREAM
          </span>
          {bufferRef.current.length > 0 && isPaused && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[9px] font-bold animate-pulse">
              {bufferRef.current.length} Buffered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold font-sans uppercase tracking-wider ${
              isPaused ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={clearLogs}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed space-y-1.5 scroll-smooth scrollbar-thin scrollbar-thumb-white/10"
      >
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/10">
             <TerminalIcon className="w-12 h-12" />
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="group flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <span className="text-white/20 shrink-0 select-none">[{log.time}]</span>
            <span className={`font-bold shrink-0 ${
              log.type.includes('CREATE') ? 'text-emerald-400' :
              log.type.includes('DELETE') ? 'text-red-400' :
              'text-amber-400'
            }`}>
              {log.type}
            </span>
            <span className="text-white/60 shrink-0">{log.subject}</span>
            <span className="text-white/30 truncate italic group-hover:text-white/50 transition-colors">
              {log.payload}
            </span>
          </div>
        ))}
        {!isPaused && (
          <div className="flex items-center gap-2 text-white/20 animate-pulse pt-2">
            <span className="w-1.5 h-3 bg-[var(--color-brand)]" />
            <span className="text-[10px] uppercase tracking-widest font-bold">listening...</span>
          </div>
        )}
      </div>
    </div>
  );
}
