import { Icon } from '../Icon';

interface MessageComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function MessageComposer({ draft, onDraftChange, onSubmit }: MessageComposerProps) {
  return (
    <form className="message-composer" onSubmit={onSubmit}>
      <button type="button" aria-label="Attach a file">
        <Icon name="paperclip" size={20} />
      </button>

      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Write a message..."
        rows={1}
      />

      <button
        className="send-button"
        type="submit"
        aria-label="Send message"
        disabled={!draft.trim()}
      >
        <Icon name="send" size={18} />
      </button>
    </form>
  );
}
