interface ConversationAvatarProps {
  initials: string;
  online: boolean;
}

export function ConversationAvatar({ initials, online }: ConversationAvatarProps) {
  return (
    <div className="conversation-avatar">
      <span>{initials}</span>
      {online && <i />}
    </div>
  );
}
