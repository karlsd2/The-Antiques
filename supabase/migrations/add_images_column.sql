-- Add images column to existing messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Make body column nullable (messages can have images only)
ALTER TABLE public.messages
ALTER COLUMN body DROP NOT NULL;

-- Update RLS policy to allow messages with only text, only images, or both
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    -- Must be the sender (prevents impersonation)
    auth.uid() = sender_id
    AND
    -- Must have either body text or images (or both)
    (body IS NOT NULL OR images IS NOT NULL)
    AND
    -- Must be in a conversation they participate in
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );
