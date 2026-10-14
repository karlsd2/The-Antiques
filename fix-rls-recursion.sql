-- Fix RLS recursion in order_items policy by using SECURITY DEFINER
-- This breaks the circular dependency: orders → order_items → orders

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update order items" ON public.order_items;

-- Create a SECURITY DEFINER function to check order_items access
-- Function accepts specific column values as parameters to avoid referencing the row
CREATE OR REPLACE FUNCTION public.check_order_item_access(p_order_id UUID, p_product_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is the buyer of the order
  IF EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id AND o.buyer_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  -- Check if the user is the seller of the product
  IF EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = p_product_id AND p.seller_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_order_item_access TO authenticated;

-- Recreate the SELECT policy using the SECURITY DEFINER function
CREATE POLICY "Users can view order items" ON public.order_items
FOR SELECT
USING (public.check_order_item_access(order_id, product_id));

-- Recreate the UPDATE policy using the SECURITY DEFINER function
-- USING checks the old row, WITH CHECK checks the new row (NEW)
CREATE POLICY "Users can update order items" ON public.order_items
FOR UPDATE
USING (public.check_order_item_access(order_id, product_id))
WITH CHECK (public.check_order_item_access(order_id, product_id));
