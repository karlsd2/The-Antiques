-- Add DELETE policy for conversations
-- Allows users to delete conversations they participate in

DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;
CREATE POLICY "Users can delete their conversations"
  ON public.conversations
  FOR DELETE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
