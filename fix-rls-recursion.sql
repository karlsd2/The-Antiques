-- Fix RLS recursion in order_items policy by using SECURITY DEFINER
-- This breaks the circular dependency: orders → order_items → orders

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;

-- Create a SECURITY DEFINER function to check order_items access
CREATE OR REPLACE FUNCTION public.check_order_item_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is the buyer of the order
  IF EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = NEW.order_id AND o.buyer_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  -- Check if the user is the seller of the product
  IF EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = NEW.product_id AND p.seller_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Recreate the policy using the SECURITY DEFINER function
CREATE POLICY "Users can view order items" ON public.order_items
FOR SELECT
USING (public.check_order_item_access());

-- Update the policy for UPDATE to use the same function
DROP POLICY IF EXISTS "Users can update order items" ON public.order_items;
CREATE POLICY "Users can update order items" ON public.order_items
FOR UPDATE
USING (public.check_order_item_access());
