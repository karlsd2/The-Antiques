import { useState, useRef } from 'react';
import { Icon } from '../Icon';

interface MessageComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: React.FormEvent, images: File[]) => void;
}

export function MessageComposer({ draft, onDraftChange, onSubmit }: MessageComposerProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedImages([...selectedImages, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(event, selectedImages);
    setSelectedImages([]);
    setImagePreviews([]);
  };

  return (
    <form className="message-composer" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <button
        type="button"
        aria-label="Attach a file"
        onClick={() => fileInputRef.current?.click()}
      >
        <Icon name="paperclip" size={20} />
      </button>

      <div className="composer-content">
        {imagePreviews.length > 0 && (
          <div className="image-previews">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="image-preview">
                <img src={preview} alt="Preview" />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Write a message..."
          rows={1}
        />
      </div>

      <button
        className="send-button"
        type="submit"
        aria-label="Send message"
        disabled={!draft.trim() && selectedImages.length === 0}
      >
        <Icon name="send" size={18} />
      </button>
    </form>
  );
}
