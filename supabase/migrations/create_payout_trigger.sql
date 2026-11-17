-- Function to process payout transactions when payout request is created
-- This ensures the balance is deducted when the payout is requested
CREATE OR REPLACE FUNCTION public.process_payout_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id TEXT;
BEGIN
  -- Only process when payout status is 'Completed'
  IF NEW.status != 'Completed' THEN
    RETURN NEW;
  END IF;

  -- Generate transaction ID
  v_transaction_id := 'PAY-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 10, '0');

  -- Create Payout transaction (deduct from balance)
  INSERT INTO wallet_transactions (seller_id, transaction_id, description, type, amount, status, order_id, order_item_id)
  SELECT
    NEW.seller_id,
    v_transaction_id,
    'Payout to ' || COALESCE(pa.bank_name, pa.account_type) || ' ···· ' || COALESCE(pa.account_number_last4, 'N/A'),
    'Payout',
    -NEW.amount,
    'Completed',
    NULL,
    NULL
  FROM payout_accounts pa
  WHERE pa.id = NEW.payout_account_id;

  -- Update seller balance
  UPDATE seller_balances
  SET available_balance = available_balance - NEW.amount,
      updated_at = TIMEZONE('utc', NOW())
  WHERE seller_id = NEW.seller_id;

  RETURN NEW;
END;
$$;

-- Create trigger on payout_requests table (fires on INSERT)
DROP TRIGGER IF EXISTS on_payout_status_change ON public.payout_requests;
CREATE TRIGGER on_payout_status_change
  AFTER INSERT ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.process_payout_transaction();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_payout_transaction TO authenticated;
