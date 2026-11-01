-- Enable Realtime for Messaging Tables
-- This migration enables Supabase Realtime for the messages and conversations tables
-- allowing live updates without page refreshes

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
