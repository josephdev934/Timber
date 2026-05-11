import React, { useState, useEffect } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { socketClient } from '@/infrastructure/socket/socketClient';
import { useAdmin } from '@/context/AdminContext';

export function ActiveRoomsTable() {
  const { token } = useAdmin();
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const socket = socketClient.getInstance();

    const handleConnect = () => {
      socketClient.joinRoom('admin:stats');
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const handleRooms = (data: any[]) => {
      setRooms(data);
    };

    socket.on('ROOMS_UPDATE', handleRooms);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('ROOMS_UPDATE', handleRooms);
      socketClient.leaveRoom('admin:stats');
    };
  }, [token]);

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden mb-8">
      <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-elevated)]/20">
        <h3 className="text-lg font-bold font-sans text-[var(--color-text)]">Active Rooms</h3>
        <button className="flex items-center gap-2 text-xs font-sans font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
          View all clusters <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans border-b border-[var(--color-border)]">
              <th className="px-6 py-4">Room ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Users</th>
              <th className="px-6 py-4">Last Event</th>
              <th className="px-6 py-4">Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] font-mono">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-[var(--color-muted)]">
                  No active rooms found. Monitoring cluster...
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="hover:bg-[var(--color-elevated)]/30 transition-colors cursor-pointer group animate-in fade-in slide-in-from-left-2 duration-300">
                  <td className="px-6 py-4 text-sm text-[var(--color-brand)] font-bold">{room.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      room.type === 'content' ? 'bg-indigo-500/10 text-indigo-500' :
                      room.type === 'group' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {room.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {room.userCount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-text)]">
                    {room.lastEventName || 'IDLE'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-1.5 rounded-full bg-[var(--color-elevated)] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${room.userCount > 100 ? 'bg-red-500' : 'bg-[var(--color-brand)]'}`} 
                        style={{ width: `${Math.min(room.userCount * 5, 100)}%` }} 
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
