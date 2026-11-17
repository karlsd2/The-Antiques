-- Fix payout_requests table status constraint to match app status values
-- First, drop the old constraint to allow status updates
ALTER TABLE public.payout_requests
DROP CONSTRAINT IF EXISTS payout_requests_status_check;

-- Update any existing rows with old status values to new ones
UPDATE public.payout_requests
SET status = 'Approved'
WHERE status = 'Completed';

UPDATE public.payout_requests
SET status = 'Rejected'
WHERE status = 'Failed';

UPDATE public.payout_requests
SET status = 'On hold'
WHERE status = 'Processing';

-- Now add the new constraint with correct status values
ALTER TABLE public.payout_requests
ADD CONSTRAINT payout_requests_status_check
CHECK (status IN ('Pending', 'Approved', 'On hold', 'Rejected'));

-- Fix pending_balance for existing sellers
-- Recalculate pending_balance based on actual pending and on-hold payout requests
UPDATE public.seller_balances sb
SET pending_balance = COALESCE((
  SELECT COALESCE(SUM(amount), 0)
  FROM public.payout_requests pr
  WHERE pr.seller_id = sb.seller_id
    AND pr.status IN ('Pending', 'On hold')
), 0),
updated_at = TIMEZONE('utc', NOW())
WHERE EXISTS (
  SELECT 1 FROM public.payout_requests pr
  WHERE pr.seller_id = sb.seller_id
);

-- Add admin RLS policies for payout_requests
DROP POLICY IF EXISTS "Admins can view all payout requests" ON public.payout_requests;
CREATE POLICY "Admins can view all payout requests" ON public.payout_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update payout request status" ON public.payout_requests;
CREATE POLICY "Admins can update payout request status" ON public.payout_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add admin RLS policy for payout_accounts
DROP POLICY IF EXISTS "Admins can view all payout accounts" ON public.payout_accounts;
CREATE POLICY "Admins can view all payout accounts" ON public.payout_accounts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
