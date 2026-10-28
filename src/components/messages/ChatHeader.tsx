import { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icon';
import { ConversationAvatar } from './ConversationAvatar';
import type { Conversation, Role, Page, Product } from '../../types';

interface ChatHeaderProps {
  conversation: Conversation;
  role: Role;
  onNavigate: (page: Page, product?: Product) => void;
}

export function ChatHeader({ conversation, role, onNavigate }: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = role === 'buyer'
    ? conversation.seller_initials
    : conversation.buyer_name.split(' ').map((name) => name[0]).join('');
  const person = role === 'buyer' ? conversation.seller_name : conversation.buyer_name;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleViewProduct = () => {
    onNavigate('product', conversation.product);
    setShowMenu(false);
  };

  const handleBlockUser = () => {
    // Not implemented
    setShowMenu(false);
  };

  const handleDeleteConversation = () => {
    // Not implemented
    setShowMenu(false);
  };

  return (
    <div className="chat-header">
      <ConversationAvatar initials={initials} online={false} />

      <div>
        <strong>{person}</strong>
        <span>Usually replies within a day</span>
      </div>

      <div className="icon-button-wrapper" ref={menuRef}>
        <button
          className="icon-button"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Conversation options"
        >
          <Icon name="more" size={20} />
        </button>
        {showMenu && (
          <div className="conversation-menu">
            <button onClick={handleViewProduct}>View Product</button>
            <button onClick={handleBlockUser}>Block User</button>
            <button onClick={handleDeleteConversation}>Delete Conversation</button>
          </div>
        )}
      </div>
    </div>
  );
}
