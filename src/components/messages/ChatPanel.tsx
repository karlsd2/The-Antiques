import { ChatHeader } from './ChatHeader';
import { ChatProduct } from './ChatProduct';
import { MessageThread } from './MessageThread';
import { MessageComposer } from './MessageComposer';
import type { Conversation, Page, ChatMessage, Role, Product } from '../../types';

interface ChatPanelProps {
  conversation: Conversation;
  role: Role;
  messages: ChatMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSendMessage: (event: React.FormEvent, images: File[]) => void;
  onNavigate: (page: Page, product?: Product) => void;
}

export function ChatPanel({
  conversation,
  role,
  messages,
  draft,
  onDraftChange,
  onSendMessage,
  onNavigate,
}: ChatPanelProps) {
  return (
    <section className="chat-panel">
      <ChatHeader conversation={conversation} role={role} onNavigate={onNavigate} />

      <ChatProduct product={conversation.product} onNavigate={onNavigate} />

      <MessageThread messages={messages} />

      <MessageComposer
        draft={draft}
        onDraftChange={onDraftChange}
        onSubmit={onSendMessage}
      />
    </section>
  );
}
