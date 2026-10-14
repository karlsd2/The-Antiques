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
SET search_path = public
AS $$
DECLARE
  v_order orders;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_item_price NUMERIC;
  v_item_name TEXT;
  v_item_condition TEXT;
  v_calculated_total NUMERIC := 0;
  v_item_count INTEGER;
BEGIN
  -- Security: Verify the buyer_id matches the authenticated user
  IF p_buyer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: buyer_id does not match authenticated user';
  END IF;

  -- Validate items array is not empty
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Items array cannot be empty';
  END IF;

  -- Check for duplicate product IDs
  SELECT COUNT(DISTINCT (item->>'product_id')::UUID) INTO v_item_count
  FROM jsonb_array_elements(p_items) AS item;

  IF v_item_count != jsonb_array_length(p_items) THEN
    RAISE EXCEPTION 'Duplicate product IDs in items array';
  END IF;

  -- Calculate total from actual product prices in database
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    -- Validate quantity is at least 1
    IF v_quantity < 1 THEN
      RAISE EXCEPTION 'Quantity must be at least 1 for product %', v_product_id;
    END IF;

    -- Get actual product data from database
    SELECT price, name, condition INTO v_item_price, v_item_name, v_item_condition
    FROM products
    WHERE id = v_product_id AND status = 'active';

    IF v_item_price IS NULL THEN
      RAISE EXCEPTION 'Product % not found or not active', v_product_id;
    END IF;

    -- Verify client-provided price matches database price
    IF ABS((v_item->>'price')::NUMERIC - v_item_price) > 0.01 THEN
      RAISE EXCEPTION 'Price mismatch for product %. Client: %, Database: %',
        v_product_id, (v_item->>'price')::NUMERIC, v_item_price;
    END IF;

    v_calculated_total := v_calculated_total + (v_item_price * v_quantity);
  END LOOP;

  -- Verify total matches calculated total (p_total includes shipping)
  IF ABS(p_total - (v_calculated_total + p_shipping_cost)) > 0.01 THEN
    RAISE EXCEPTION 'Total mismatch. Client: % (subtotal: %, shipping: %), Calculated: %',
      p_total, v_calculated_total, p_shipping_cost, v_calculated_total + p_shipping_cost;
  END IF;

  -- Create order
  INSERT INTO orders (order_number, buyer_id, total, shipping_cost, status, shipping_address)
  VALUES (p_order_number, p_buyer_id, p_total, p_shipping_cost, 'Confirmed', p_shipping_address)
  RETURNING * INTO v_order;

  -- Process each item atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    -- Re-fetch product data to ensure we use database values
    SELECT price, name, condition INTO v_item_price, v_item_name, v_item_condition
    FROM products
    WHERE id = v_product_id AND status = 'active';

    -- Insert order item using database values, not client-provided
    INSERT INTO order_items (order_id, product_id, product_name, product_condition, price, quantity)
    VALUES (
      v_order.id,
      v_product_id,
      v_item_name,
      v_item_condition,
      v_item_price,
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

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION create_order_with_stock TO authenticated;
