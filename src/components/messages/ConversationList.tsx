import { ConversationItem } from './ConversationItem';
import type { Conversation, Role } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | undefined;
  role: Role;
  onConversationSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, role, onConversationSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="conversation-list">
        <div className="table-row">
          <span>No conversations yet.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          role={role}
          isActive={activeId === conversation.id}
          onClick={() => onConversationSelect(conversation.id)}
        />
      ))}
    </div>
  );
}
