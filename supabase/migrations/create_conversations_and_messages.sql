-- Conversations and Messages Tables Migration
-- This migration creates the messaging system for The Antiques
-- Run this in the Supabase SQL Editor or via migration tool
--
-- Note: When running this migration for the first time in Supabase SQL Editor,
-- the REVOKE statements at the beginning will be ignored (tables don't exist yet).
-- The DO blocks with exception handling ensure the migration completes successfully.

-- ============================================
-- Conversations Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,

  -- Ensure one conversation per buyer-seller-product combination
  CONSTRAINT unique_conversation UNIQUE (buyer_id, seller_id, product_id),

  -- Ensure buyer and seller are different users
  CONSTRAINT different_users CHECK (buyer_id != seller_id)
);

-- ============================================
-- Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON public.conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Table-Level Grants for Conversations
-- ============================================
-- Revoke any existing broad grants to ensure security (ignore if doesn't exist)
DO $$
BEGIN
  EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.conversations FROM authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END$$;

DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON public.conversations FROM authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END$$;

-- Grant SELECT on conversations (controlled by RLS policies)
GRANT SELECT ON public.conversations TO authenticated;

-- Grant INSERT on conversations (controlled by RLS policies)
GRANT INSERT ON public.conversations TO authenticated;

-- Grant UPDATE on conversations (controlled by RLS policies)
GRANT UPDATE ON public.conversations TO authenticated;

-- ============================================
-- Column-Level Grants for Messages Table
-- ============================================
-- Revoke any existing broad grants to ensure security (ignore if doesn't exist)
DO $$
BEGIN
  EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.messages FROM authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END$$;

DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON public.messages FROM authenticated';
EXCEPTION WHEN undefined_object THEN NULL;
END$$;

-- Grant SELECT on messages (controlled by RLS policies)
GRANT SELECT ON public.messages TO authenticated;

-- Grant INSERT on messages (controlled by RLS policies)
GRANT INSERT ON public.messages TO authenticated;

-- Grant UPDATE on read_at column only to authenticated users
-- This prevents modification of body, sender_id, conversation_id, or created_at
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- ============================================
-- RLS Policies for Conversations
-- ============================================

-- Users can view conversations where they are the buyer
DROP POLICY IF EXISTS "Buyers can view their conversations" ON public.conversations;
CREATE POLICY "Buyers can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = buyer_id);

-- Users can view conversations where they are the seller
DROP POLICY IF EXISTS "Sellers can view their conversations" ON public.conversations;
CREATE POLICY "Sellers can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Buyers can create conversations (they initiate conversations with sellers)
-- Validates: buyer role, seller role, and product ownership by seller
DROP POLICY IF EXISTS "Buyers can create conversations" ON public.conversations;
CREATE POLICY "Buyers can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    -- Must be the buyer
    auth.uid() = buyer_id
    AND
    -- Buyer must have buyer role
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = buyer_id AND role = 'buyer'
    )
    AND
    -- Seller must have seller role
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = seller_id AND role = 'seller'
    )
    AND
    -- Product must belong to the specified seller
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id AND seller_id = seller_id
    )
  );

-- Users can update conversation metadata (handled by trigger, but policy needed)
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================
-- RLS Policies for Messages
-- ============================================

-- Users can view messages in conversations they participate in
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Users can insert messages into conversations they participate in
-- Prevents sender impersonation by requiring auth.uid() = sender_id
-- Allows messages with only text, only images, or both
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

-- Users can only update read status of messages sent to them
-- Column-level grants prevent modification of body, sender_id, conversation_id, or created_at
DROP POLICY IF EXISTS "Users can update read status of messages received" ON public.messages;
CREATE POLICY "Users can update read status of messages received"
  ON public.messages
  FOR UPDATE
  USING (
    -- Must be recipient (not sender)
    auth.uid() != sender_id
    AND
    -- Must be in a conversation they participate in
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- ============================================
-- Triggers
-- ============================================

-- Function to update conversation timestamp when a new message is sent
-- Uses SECURITY DEFINER to bypass RLS for the update
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = TIMEZONE('utc', NOW())
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message insert only if it doesn't exist
-- This prevents errors when migration is rerun
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_message_insert'
    AND tgrelid = 'public.messages'::regclass
  ) THEN
    CREATE TRIGGER on_message_insert
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.update_conversation_timestamp();
  END IF;
END$$;

-- Create updated_at trigger for conversations table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_conversations_updated_at'
    AND tgrelid = 'public.conversations'::regclass
  ) THEN
    CREATE TRIGGER update_conversations_updated_at
      BEFORE UPDATE ON public.conversations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Create updated_at trigger for messages table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_messages_updated_at'
    AND tgrelid = 'public.messages'::regclass
  ) THEN
    CREATE TRIGGER update_messages_updated_at
      BEFORE UPDATE ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get unread message count for the authenticated user
-- Uses auth.uid() to identify the user (security: cannot be spoofed by frontend)
CREATE OR REPLACE FUNCTION public.get_unread_count()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.messages
    WHERE conversation_id IN (
      SELECT id FROM public.conversations
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
    AND sender_id != auth.uid()
    AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark all messages in a conversation as read for the authenticated user
-- Uses auth.uid() to identify the user (security: cannot be spoofed by frontend)
-- Validates that user participates in the conversation
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(p_conversation_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = TIMEZONE('utc', NOW())
  WHERE conversation_id = p_conversation_id
  AND sender_id != auth.uid()
  AND read_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant execute permission on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_unread_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(UUID) TO authenticated;
