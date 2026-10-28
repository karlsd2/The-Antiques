import { Icon } from '../Icon';
import { ConversationAvatar } from './ConversationAvatar';
import type { Conversation, Role } from '../../types';

interface ChatHeaderProps {
  conversation: Conversation;
  role: Role;
}

export function ChatHeader({ conversation, role }: ChatHeaderProps) {
  const initials = role === 'buyer'
    ? conversation.seller_initials
    : conversation.buyer_name.split(' ').map((name) => name[0]).join('');
  const person = role === 'buyer' ? conversation.seller_name : conversation.buyer_name;

  return (
    <div className="chat-header">
      <ConversationAvatar initials={initials} online={false} />

      <div>
        <strong>{person}</strong>
        <span>Usually replies within a day</span>
      </div>

      <button aria-label="Conversation options">
        <Icon name="more" />
      </button>
    </div>
  );
}
