'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';

export default function ContentPage({ params }: { params: { contentId: string } }) {

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('Connected:', socket.id);

      // Join room
      socket.emit('join_room', {
        contentId: params.contentId
      });
    });

    socket.on('comment_created', (data) => {
      console.log('🔥 Real-time comment received:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [params.contentId]);

  return (
    <div>
      <h1>Content Page</h1>
      <p>Content ID: {params.contentId}</p>
      <p>Open console to see real-time updates</p>
    </div>
  );
}