"use client";

import React, { useState, useEffect } from 'react';
import { socketClient } from '@/infrastructure/socket/socketClient';

interface ActivityEvent {
  id: string;
  actorName: string;
  actionText: string;
  time: string;
  type: string;
  color: 'emerald' | 'amber' | 'red' | 'muted';
  avatarUrl?: string;
}

export function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const socket = socketClient.getInstance();
    
    // Join the activity room
    socketClient.joinRoom('admin:activity');

    const handleNewEvent = (payload: any) => {
      const { eventName, summary, timestamp, payload: eventData } = payload;
      
      const newEvent: ActivityEvent = {
        id: `${eventName}-${timestamp}-${Math.random()}`,
        actorName: eventData?.actorName || eventData?.username || 'System',
        actionText: summary,
        time: new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: eventName,
        color: deriveColor(eventName),
        avatarUrl: eventData?.profilePhoto || eventData?.avatar
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 50));
    };

    // Events to listen for based on ADMIN_BUS_EVENTS
    const activityEvents = [
      'COMMENT_CREATED', 'COMMENT_DELETED', 'POST_CREATED', 'POST_DELETED',
      'MESSAGE_CREATED', 'GROUP_JOINED', 'MEDIA_UPLOADED', 'REPORT_SUBMITTED', 'USER_BANNED'
    ];

    activityEvents.forEach(event => {
      socket.on(event, handleNewEvent);
    });

    return () => {
      activityEvents.forEach(event => {
        socket.off(event, handleNewEvent);
      });
      socketClient.leaveRoom('admin:activity');
    };
  }, []);

  const deriveColor = (eventName: string): 'emerald' | 'amber' | 'red' | 'muted' => {
    if (eventName.includes('CREATED') || eventName.includes('JOINED') || eventName.includes('UPLOADED')) return 'emerald';
    if (eventName.includes('UPDATED')) return 'amber';
    if (eventName.includes('DELETED') || eventName.includes('BANNED') || eventName.includes('FAILED')) return 'red';
    return 'muted';
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm col-span-1 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <h3 className="text-lg font-bold font-sans text-[var(--color-text)]">Live Activity Feed</h3>
        </div>
        <div className="text-xs font-mono text-[var(--color-muted)] px-2 py-0.5 rounded-full bg-[var(--color-elevated)] border border-[var(--color-border)]">
          {events.length} Events
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-3">
        {events.length > 0 ? (
          events.map((event) => {
            let borderColor = 'border-l-[var(--color-border)]';
            if (event.color === 'emerald') borderColor = 'border-l-emerald-500';
            if (event.color === 'amber') borderColor = 'border-l-amber-500';
            if (event.color === 'red') borderColor = 'border-l-red-500';

            return (
              <div 
                key={event.id}
                className={`flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-elevated)] border border-[var(--color-border)] border-l-4 ${borderColor} animate-in slide-in-from-top-2 duration-300`}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 border border-[var(--color-border)] overflow-hidden">
                  {event.avatarUrl ? (
                    <img src={event.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold font-sans text-[var(--color-text)]">
                      {event.actorName.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans text-[var(--color-text)] truncate">
                    <span className="font-bold text-[var(--color-text)]">{event.actorName}</span>{' '}
                    <span className="text-[var(--color-muted)]">{event.actionText.replace(event.actorName, '').trim()}</span>
                  </p>
                  <p className="text-xs font-mono text-[var(--color-muted)] mt-1 flex items-center gap-1.5">
                    {event.time} 
                    <span className="text-[10px]">•</span> 
                    <span className={`
                      ${event.color === 'red' ? 'text-red-500' : ''}
                      ${event.color === 'emerald' ? 'text-emerald-500' : ''}
                      ${event.color === 'amber' ? 'text-amber-500' : ''}
                    `}>
                      {event.type}
                    </span>
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-muted)] font-sans text-center px-4">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--color-border)] mb-3 animate-spin duration-10000" />
            <p className="text-sm italic">Waiting for platform activity...</p>
          </div>
        )}
      </div>
    </div>
  );
}
