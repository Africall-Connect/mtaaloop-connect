
-- Customer wallet table
CREATE TABLE public.customer_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer wallet transactions
CREATE TABLE public.customer_wallet_tx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customer_wallet_user ON public.customer_wallet(user_id);
CREATE INDEX idx_customer_wallet_tx_user ON public.customer_wallet_tx(user_id);
CREATE INDEX idx_customer_wallet_tx_created ON public.customer_wallet_tx(created_at DESC);

-- RLS
ALTER TABLE public.customer_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wallet_tx ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can view own wallet" ON public.customer_wallet
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can read their own transactions
CREATE POLICY "Users can view own transactions" ON public.customer_wallet_tx
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Only server-side (service role) or DB functions should modify wallet
-- But we need insert for the auto-create trigger
CREATE POLICY "System can insert wallet" ON public.customer_wallet
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert tx" ON public.customer_wallet_tx
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER set_customer_wallet_updated_at
  BEFORE UPDATE ON public.customer_wallet
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to debit wallet atomically
CREATE OR REPLACE FUNCTION public.debit_customer_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Order payment',
  p_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Lock the row for update
  SELECT balance INTO current_balance
  FROM customer_wallet
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Available: %, Required: %', current_balance, p_amount;
  END IF;

  -- Debit the wallet
  UPDATE customer_wallet
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO customer_wallet_tx (user_id, amount, type, description, order_id)
  VALUES (p_user_id, p_amount, 'debit', p_description, p_order_id);

  RETURN TRUE;
END;
$$;

-- Function to credit wallet
CREATE OR REPLACE FUNCTION public.credit_customer_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Top-up',
  p_order_id UUID DEFAULT NULL,
  p_reference TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create wallet if not exists
  INSERT INTO customer_wallet (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Credit the wallet
  UPDATE customer_wallet
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO customer_wallet_tx (user_id, amount, type, description, order_id, reference)
  VALUES (p_user_id, p_amount, 'credit', p_description, p_order_id, p_reference);

  RETURN TRUE;
END;
$$;

-- Auto-create wallet for new users
CREATE OR REPLACE FUNCTION public.auto_create_customer_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.customer_wallet (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_customer_wallet();
