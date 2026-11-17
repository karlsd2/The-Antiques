-- Wallet and payout system tables
-- This migration creates tables for seller wallet management, transactions, and payout accounts

-- Seller balance tracking table
CREATE TABLE public.seller_balances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  available_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lifetime_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sale', 'Fee', 'Payout', 'Refund')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Pending', 'Processed', 'Completed', 'Failed')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Payout accounts table
CREATE TABLE public.payout_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'gcash')),
  bank_name TEXT,
  account_number_last4 TEXT,
  account_holder_name TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Payout requests table
CREATE TABLE public.payout_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payout_account_id UUID REFERENCES public.payout_accounts(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'On hold', 'Rejected')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_seller_balances_seller ON public.seller_balances(seller_id);
CREATE INDEX idx_wallet_transactions_seller ON public.wallet_transactions(seller_id);
CREATE INDEX idx_wallet_transactions_date ON public.wallet_transactions(date DESC);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX idx_payout_accounts_seller ON public.payout_accounts(seller_id);
CREATE INDEX idx_payout_requests_seller ON public.payout_requests(seller_id);

-- Enable Row Level Security
ALTER TABLE public.seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_balances
CREATE POLICY "Sellers can view own balance" ON public.seller_balances FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert own balance" ON public.seller_balances FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own balance" ON public.seller_balances FOR UPDATE USING (auth.uid() = seller_id);

-- RLS Policies for wallet_transactions
CREATE POLICY "Sellers can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert own transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- RLS Policies for payout_accounts
CREATE POLICY "Sellers can view own payout accounts" ON public.payout_accounts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert own payout accounts" ON public.payout_accounts FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own payout accounts" ON public.payout_accounts FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Admins can view all payout accounts" ON public.payout_accounts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for payout_requests
CREATE POLICY "Sellers can view own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert own payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Admins can view all payout requests" ON public.payout_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can update payout request status" ON public.payout_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to create wallet transaction and update balance
CREATE OR REPLACE FUNCTION public.create_wallet_transaction(
  p_seller_id UUID,
  p_transaction_id TEXT,
  p_description TEXT,
  p_type TEXT,
  p_amount DECIMAL(10, 2),
  p_status TEXT DEFAULT 'Available',
  p_order_id UUID DEFAULT NULL,
  p_order_item_id UUID DEFAULT NULL
)
RETURNS wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction wallet_transactions;
  v_balance seller_balances;
BEGIN
  -- Security: Verify seller_id matches authenticated user
  IF p_seller_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: seller_id does not match authenticated user';
  END IF;

  -- Create the transaction
  INSERT INTO wallet_transactions (seller_id, transaction_id, description, type, amount, status, order_id, order_item_id)
  VALUES (p_seller_id, p_transaction_id, p_description, p_type, p_amount, p_status, p_order_id, p_order_item_id)
  RETURNING * INTO v_transaction;

  -- Get or create seller balance
  INSERT INTO seller_balances (seller_id, available_balance, pending_balance, lifetime_earnings)
  VALUES (p_seller_id, 0, 0, 0)
  ON CONFLICT (seller_id) DO NOTHING;

  SELECT * INTO v_balance FROM seller_balances WHERE seller_id = p_seller_id;

  -- Update balance based on transaction type and status
  IF p_type = 'Sale' THEN
    IF p_status = 'Available' THEN
      UPDATE seller_balances
      SET available_balance = available_balance + p_amount,
          lifetime_earnings = lifetime_earnings + p_amount,
          updated_at = TIMEZONE('utc', NOW())
      WHERE seller_id = p_seller_id;
    ELSIF p_status = 'Pending' THEN
      UPDATE seller_balances
      SET pending_balance = pending_balance + p_amount,
          lifetime_earnings = lifetime_earnings + p_amount,
          updated_at = TIMEZONE('utc', NOW())
      WHERE seller_id = p_seller_id;
    END IF;
  ELSIF p_type = 'Fee' THEN
    IF p_status = 'Processed' THEN
      UPDATE seller_balances
      SET available_balance = available_balance - p_amount,
          updated_at = TIMEZONE('utc', NOW())
      WHERE seller_id = p_seller_id;
    END IF;
  ELSIF p_type = 'Payout' THEN
    IF p_status = 'Completed' THEN
      UPDATE seller_balances
      SET available_balance = available_balance - p_amount,
          updated_at = TIMEZONE('utc', NOW())
      WHERE seller_id = p_seller_id;
    END IF;
  END IF;

  RETURN v_transaction;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_wallet_transaction TO authenticated;

-- Trigger to update seller_balances updated_at
CREATE TRIGGER update_seller_balances_updated_at BEFORE UPDATE ON public.seller_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_accounts_updated_at BEFORE UPDATE ON public.payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
