-- Atomic order creation with stock management
-- This function creates an order, order items, and decrements product stock
-- in a single transaction to prevent race conditions
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_order_with_stock(
  p_buyer_id UUID,
  p_order_number TEXT,
  p_total NUMERIC,
  p_shipping_cost NUMERIC,
  p_shipping_address JSONB,
  p_items JSONB
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Create order
  INSERT INTO orders (order_number, buyer_id, total, shipping_cost, status, shipping_address)
  VALUES (p_order_number, p_buyer_id, p_total, p_shipping_cost, 'Confirmed', p_shipping_address)
  RETURNING * INTO v_order;

  -- Process each item atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    -- Insert order item
    INSERT INTO order_items (order_id, product_id, product_name, product_condition, price, quantity)
    VALUES (
      v_order.id,
      v_product_id,
      v_item->>'product_name',
      v_item->>'product_condition',
      (v_item->>'price')::NUMERIC,
      v_quantity
    );

    -- Decrement stock atomically with stock check
    UPDATE products
    SET stock = stock - v_quantity
    WHERE id = v_product_id AND stock >= v_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;
  END LOOP;

  RETURN v_order;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_stock TO authenticated;
