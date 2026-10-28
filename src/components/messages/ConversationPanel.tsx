import { Icon } from '../Icon';
import { ConversationList } from './ConversationList';
import type { Conversation, Role } from '../../types';

interface ConversationPanelProps {
  conversations: Conversation[];
  activeId: string | undefined;
  role: Role;
  search: string;
  onSearchChange: (value: string) => void;
  onConversationSelect: (id: string) => void;
}

export function ConversationPanel({
  conversations,
  activeId,
  role,
  search,
  onSearchChange,
  onConversationSelect,
}: ConversationPanelProps) {
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <aside className="conversation-panel">
      <div className="conversation-tools">
        <strong>Inbox</strong>
        <span>{unreadCount} unread</span>

        <label className="message-search">
          <Icon name="search" size={17} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search conversations"
          />
        </label>
      </div>

      <ConversationList
        conversations={conversations}
        activeId={activeId}
        role={role}
        onConversationSelect={onConversationSelect}
      />
    </aside>
  );
}
