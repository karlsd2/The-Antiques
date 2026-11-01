-- Grant DELETE permission on conversations table
-- This allows authenticated users to delete conversations (controlled by RLS policies)

GRANT DELETE ON public.conversations TO authenticated;
