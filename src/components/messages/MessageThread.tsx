import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../types';

interface MessageThreadProps {
  messages: ChatMessage[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="message-thread" ref={threadRef}>
      <div className="day-divider">
        <span>Today</span>
      </div>

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
