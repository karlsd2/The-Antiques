import { Icon } from '../Icon';
import type { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`message-row ${message.is_me ? 'mine' : ''}`}>
      <div className="message-bubble">
        {message.body && <p>{message.body}</p>}

        {message.images && message.images.length > 0 && (
          <div className="message-images">
            {message.images.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt="Message attachment"
                className="message-image"
              />
            ))}
          </div>
        )}

        <span>
          {formatTime(message.created_at)}

          {message.is_me && (
            <Icon name="check" size={12} />
          )}
        </span>
      </div>
    </div>
  );
}
