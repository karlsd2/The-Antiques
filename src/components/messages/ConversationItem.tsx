import { ConversationAvatar } from './ConversationAvatar';
import type { Conversation, Role } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  role: Role;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, role, isActive, onClick }: ConversationItemProps) {
  const person = role === 'buyer' ? conversation.seller_name : conversation.buyer_name;
  const initials = role === 'buyer'
    ? conversation.seller_initials
    : conversation.buyer_name.split(' ').map((name) => name[0]).join('');

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
    <button
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <ConversationAvatar initials={initials} online={false} />

      <span className="conversation-copy">
        <span>
          <strong>{person}</strong>
          <small>{formatTime(conversation.updated_at)}</small>
        </span>

        <b>{conversation.product.name}</b>
        <em>{conversation.last_message || 'No messages yet'}</em>
      </span>

      {conversation.unread_count > 0 && (
        <span className="unread-count">
          {conversation.unread_count}
        </span>
      )}
    </button>
  );
}
