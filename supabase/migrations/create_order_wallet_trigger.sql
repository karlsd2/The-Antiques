-- Function to process wallet transactions when an order is delivered
-- This creates Sale and Fee transactions for the seller
CREATE OR REPLACE FUNCTION public.process_order_wallet_transactions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_item RECORD;
  v_seller_id UUID;
  v_sale_amount DECIMAL(10, 2);
  v_fee_amount DECIMAL(10, 2);
  v_transaction_id TEXT;
  v_item_index INTEGER := 0;
BEGIN
  -- Only process when order status changes to 'Delivered'
  IF NEW.status != 'Delivered' OR (OLD.status = 'Delivered' AND NEW.status = 'Delivered') THEN
    RETURN NEW;
  END IF;

  -- Process each order item
  FOR v_order_item IN
    SELECT oi.id, oi.product_id, oi.product_name, oi.price, oi.quantity, p.seller_id
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = NEW.id
  LOOP
    v_seller_id := v_order_item.seller_id;
    v_sale_amount := v_order_item.price * v_order_item.quantity;
    v_fee_amount := v_sale_amount * 0.10; -- 10% marketplace fee
    v_item_index := v_item_index + 1;

    -- Generate transaction IDs
    v_transaction_id := 'ORD-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 10, '0') || '-' || v_item_index;

    -- Create Sale transaction (net amount after fee)
    INSERT INTO wallet_transactions (seller_id, transaction_id, description, type, amount, status, order_id, order_item_id)
    VALUES (
      v_seller_id,
      v_transaction_id,
      'Order ' || NEW.order_number || ' - ' || v_order_item.product_name,
      'Sale',
      v_sale_amount - v_fee_amount,
      'Available',
      NEW.id,
      v_order_item.id
    );

    -- Create Fee transaction
    INSERT INTO wallet_transactions (seller_id, transaction_id, description, type, amount, status, order_id, order_item_id)
    VALUES (
      v_seller_id,
      'FEE-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 10, '0') || '-' || v_item_index,
      'Marketplace fee - Order ' || NEW.order_number,
      'Fee',
      -v_fee_amount,
      'Processed',
      NEW.id,
      v_order_item.id
    );

    -- Update seller balance
    INSERT INTO seller_balances (seller_id, available_balance, pending_balance, lifetime_earnings)
    VALUES (v_seller_id, 0, 0, 0)
    ON CONFLICT (seller_id) DO UPDATE SET
      available_balance = seller_balances.available_balance + (v_sale_amount - v_fee_amount),
      lifetime_earnings = seller_balances.lifetime_earnings + (v_sale_amount - v_fee_amount),
      updated_at = TIMEZONE('utc', NOW());
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_order_wallet_transactions();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_order_wallet_transactions TO authenticated;
