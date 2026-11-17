-- Function to deduct balance when payout request is created
CREATE OR REPLACE FUNCTION public.deduct_balance_on_payout_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deduct from available balance when payout request is created
  UPDATE seller_balances
  SET available_balance = available_balance - NEW.amount,
      pending_balance = pending_balance + NEW.amount,
      updated_at = TIMEZONE('utc', NOW())
  WHERE seller_id = NEW.seller_id;

  RETURN NEW;
END;
$$;

-- Function to process payout transactions when payout request is approved
-- This updates the pending transaction to completed and deducts balance
CREATE OR REPLACE FUNCTION public.process_payout_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when payout status changes to 'Approved'
  IF NEW.status != 'Approved' OR (OLD.status = 'Approved' AND NEW.status = 'Approved') THEN
    RETURN NEW;
  END IF;

  -- Update the pending wallet transaction to completed
  UPDATE wallet_transactions
  SET status = 'Completed'
  WHERE seller_id = NEW.seller_id
    AND type = 'Payout'
    AND amount = -NEW.amount
    AND status = 'Pending'
    AND created_at >= (NEW.created_at - INTERVAL '1 minute');

  -- Update seller balance (reduce pending balance since funds are sent)
  UPDATE seller_balances
  SET pending_balance = pending_balance - NEW.amount,
      updated_at = TIMEZONE('utc', NOW())
  WHERE seller_id = NEW.seller_id;

  -- Set processed_at timestamp
  UPDATE payout_requests
  SET processed_at = TIMEZONE('utc', NOW())
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Function to revert payout when rejected
CREATE OR REPLACE FUNCTION public.revert_payout_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when payout status changes to 'Rejected'
  IF NEW.status != 'Rejected' OR (OLD.status = 'Rejected' AND NEW.status = 'Rejected') THEN
    RETURN NEW;
  END IF;

  -- Update the pending wallet transaction to failed
  UPDATE wallet_transactions
  SET status = 'Failed',
      amount = 0
  WHERE seller_id = NEW.seller_id
    AND type = 'Payout'
    AND amount = -NEW.amount
    AND status = 'Pending'
    AND created_at >= (NEW.created_at - INTERVAL '1 minute');

  -- Refund the balance from pending back to available
  UPDATE seller_balances
  SET available_balance = available_balance + NEW.amount,
      pending_balance = pending_balance - NEW.amount,
      updated_at = TIMEZONE('utc', NOW())
  WHERE seller_id = NEW.seller_id;

  RETURN NEW;
END;
$$;

-- Function to handle 'On hold' status
CREATE OR REPLACE FUNCTION public.handle_payout_on_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when payout status changes to 'On hold'
  IF NEW.status != 'On hold' OR (OLD.status = 'On hold' AND NEW.status = 'On hold') THEN
    RETURN NEW;
  END IF;

  -- Update the pending wallet transaction to indicate it's on hold
  UPDATE wallet_transactions
  SET status = 'Available'
  WHERE seller_id = NEW.seller_id
    AND type = 'Payout'
    AND amount = -NEW.amount
    AND status = 'Pending'
    AND created_at >= (NEW.created_at - INTERVAL '1 minute');

  RETURN NEW;
END;
$$;

-- Create triggers on payout_requests table
DROP TRIGGER IF EXISTS on_payout_request_insert ON public.payout_requests;
DROP TRIGGER IF EXISTS on_payout_status_change ON public.payout_requests;
DROP TRIGGER IF EXISTS on_payout_reject ON public.payout_requests;
DROP TRIGGER IF EXISTS on_payout_on_hold ON public.payout_requests;

CREATE TRIGGER on_payout_request_insert
  AFTER INSERT ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_balance_on_payout_request();

CREATE TRIGGER on_payout_status_change
  AFTER UPDATE OF status ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.process_payout_transaction();

CREATE TRIGGER on_payout_reject
  AFTER UPDATE OF status ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.revert_payout_transaction();

CREATE TRIGGER on_payout_on_hold
  AFTER UPDATE OF status ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payout_on_hold();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.deduct_balance_on_payout_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payout_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_payout_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_payout_on_hold TO authenticated;
