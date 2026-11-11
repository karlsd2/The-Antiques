import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../types';

interface MessageThreadProps {
  messages: ChatMessage[];
}

function dayKey(timestamp: string) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dayKey(timestamp) === dayKey(now.toISOString())) return 'Today';
  if (dayKey(timestamp) === dayKey(yesterday.toISOString())) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export function MessageThread({ messages }: MessageThreadProps) {
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  let lastDay = '';

  return (
    <div className="message-thread" ref={threadRef}>
      {messages.map((message) => {
        const day = dayKey(message.created_at);
        const showDivider = day !== lastDay;
        lastDay = day;

        return (
          <div key={message.id}>
            {showDivider && (
              <div className="day-divider">
                <span>{dayLabel(message.created_at)}</span>
              </div>
            )}
            <MessageBubble message={message} />
          </div>
        );
      })}
    </div>
  );
}
