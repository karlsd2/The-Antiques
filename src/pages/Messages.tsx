import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { ConversationPanel, ChatPanel } from '../components/messages';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { supabase } from '../lib/supabase';
import '../components/messages/Messages.css';
import type { Page, Product, Role, ChatMessage, Conversation } from '../types';

export function Messages({
  role,
  navigate,
  products = [],
  conversationId: initialConversationId,
}: {
  role: Role;
  navigate: (page: Page, product?: Product) => void;
  products?: Product[];
  conversationId?: string;
}) {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | undefined>(initialConversationId);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');

  // Fetch conversations from Supabase
  const { conversations, loading: conversationsLoading, error: conversationsError, refetch: refetchConversations } = useConversations(
    user?.id || null,
    role
  );

  // Set active conversation when conversationId prop changes
  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
    }
  }, [initialConversationId]);

  // Fetch messages for selected conversation
  const { messages, loading: messagesLoading, error: messagesError, refetch, addMessage } = useMessages(
    activeId || null,
    user?.id || null
  );

  const active = conversations.find(
    (conversation) => conversation.id === activeId
  );

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (activeId && user?.id) {
      markMessagesAsRead(activeId);
    }
  }, [activeId, user?.id]);

  async function markMessagesAsRead(conversationId: string) {
    try {
      const { error } = await supabase.rpc('mark_conversation_as_read', {
        p_conversation_id: conversationId,
      });
      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }

  const visible = conversations.filter((conversation) => {
    const person =
      role === 'buyer' ? conversation.seller_name : conversation.buyer_name;

    return `${person} ${conversation.product.name}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!draft.trim() || !user?.id) return;

    const messageBody = draft.trim();

    try {
      let conversationId = activeId;

      // If no conversation is selected, this is an error state
      // In a real app, you'd handle this differently (e.g., from product page)
      if (!conversationId) {
        alert('Please select a conversation to send a message.');
        return;
      }

      // Send the message to Supabase and return the inserted data
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: messageBody,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Clear the draft
      setDraft('');

      // Immediately add the message to local state so sender sees it without waiting for Realtime
      if (messageData) {
        addMessage(messageData);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

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

  // Convert database messages to UI format
  const uiMessages: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    body: msg.body,
    created_at: msg.created_at,
    read_at: msg.read_at,
    is_me: msg.is_me,
  }));

  if (conversationsLoading) {
    return (
      <main className="messages-page">
        <div className="messages-intro">
          <div>
            <span className="eyebrow">
              {role === 'buyer' ? 'Your conversations' : 'Buyer conversations'}
            </span>
            <h1>Messages</h1>
          </div>
          <p>
            {role === 'buyer'
              ? 'Ask sellers about the pieces you love.'
              : 'Help collectors feel confident about every piece.'}
          </p>
        </div>
        <div className="messenger">
          <ConversationPanel
            conversations={[]}
            activeId={activeId}
            role={role}
            search={search}
            onSearchChange={setSearch}
            onConversationSelect={setActiveId}
          />
          <section className="chat-panel">
            <div className="chat-header">
              <div>Loading conversations...</div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (conversationsError) {
    return (
      <main className="messages-page">
        <div className="messages-intro">
          <div>
            <span className="eyebrow">
              {role === 'buyer' ? 'Your conversations' : 'Buyer conversations'}
            </span>
            <h1>Messages</h1>
          </div>
          <p>
            {role === 'buyer'
              ? 'Ask sellers about the pieces you love.'
              : 'Help collectors feel confident about every piece.'}
          </p>
        </div>
        <div className="messenger">
          <ConversationPanel
            conversations={[]}
            activeId={activeId}
            role={role}
            search={search}
            onSearchChange={setSearch}
            onConversationSelect={setActiveId}
          />
          <section className="chat-panel">
            <div className="chat-header">
              <div>Error loading conversations: {conversationsError.message}</div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!active) {
    return (
      <main className="messages-page">
        <div className="messages-intro">
          <div>
            <span className="eyebrow">
              {role === 'buyer' ? 'Your conversations' : 'Buyer conversations'}
            </span>
            <h1>Messages</h1>
          </div>
          <p>
            {role === 'buyer'
              ? 'Ask sellers about the pieces you love.'
              : 'Help collectors feel confident about every piece.'}
          </p>
        </div>
        <div className="messenger">
          <ConversationPanel
            conversations={visible}
            activeId={activeId}
            role={role}
            search={search}
            onSearchChange={setSearch}
            onConversationSelect={setActiveId}
          />
          <section className="chat-panel">
            <div className="chat-header">
              <div>Select a conversation to start messaging</div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="messages-page">
      <div className="messages-intro">
        <div>
          <span className="eyebrow">
            {role === 'buyer' ? 'Your conversations' : 'Buyer conversations'}
          </span>
          <h1>Messages</h1>
        </div>

        <p>
          {role === 'buyer'
            ? 'Ask sellers about the pieces you love.'
            : 'Help collectors feel confident about every piece.'}
        </p>
      </div>

      <div className="messenger">
        <ConversationPanel
          conversations={visible}
          activeId={activeId}
          role={role}
          search={search}
          onSearchChange={setSearch}
          onConversationSelect={setActiveId}
        />

        <ChatPanel
          conversation={active}
          role={role}
          messages={uiMessages}
          draft={draft}
          onDraftChange={setDraft}
          onSendMessage={sendMessage}
          onNavigate={navigate}
        />
      </div>

      <p className="message-safety">
        <Icon name="shield" size={14} />
        For your protection, keep payments and communication within The Antiques.
      </p>
    </main>
  );
}
