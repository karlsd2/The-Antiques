import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../types';

interface MessageThreadProps {
  messages: ChatMessage[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  return (
    <div className="message-thread">
      <div className="day-divider">
        <span>Today</span>
      </div>

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
