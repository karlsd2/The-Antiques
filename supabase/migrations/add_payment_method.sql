-- Add payment_method column to orders table
-- This stores the selected payment method (COD, GCash, etc.)

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'COD';

-- Add GCash reference number column (optional for demo purposes)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS gcash_reference_number TEXT;

-- Add payment status column to track payment completion
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed'));
