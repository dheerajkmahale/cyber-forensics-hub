CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_upload_id UUID REFERENCES public.analysis_uploads(id) ON DELETE CASCADE,
  transaction_ref TEXT NOT NULL,
  sender_account_ref TEXT NOT NULL,
  receiver_account_ref TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
ON public.transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_analysis_upload
ON public.transactions (analysis_upload_id);

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Users can create their own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_upload_id UUID REFERENCES public.analysis_uploads(id) ON DELETE CASCADE,
  account_ref TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_accounts_user_created
ON public.accounts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_analysis_upload
ON public.accounts (analysis_upload_id);

DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own accounts" ON public.accounts;
CREATE POLICY "Users can create their own accounts"
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts"
ON public.accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.fraud_rings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_upload_id UUID REFERENCES public.analysis_uploads(id) ON DELETE CASCADE,
  ring_ref TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  account_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  risk_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_rings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_fraud_rings_user_created
ON public.fraud_rings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_rings_analysis_upload
ON public.fraud_rings (analysis_upload_id);

DROP POLICY IF EXISTS "Users can view their own fraud rings" ON public.fraud_rings;
CREATE POLICY "Users can view their own fraud rings"
ON public.fraud_rings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own fraud rings" ON public.fraud_rings;
CREATE POLICY "Users can create their own fraud rings"
ON public.fraud_rings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own fraud rings" ON public.fraud_rings;
CREATE POLICY "Users can update their own fraud rings"
ON public.fraud_rings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fraud rings" ON public.fraud_rings;
CREATE POLICY "Users can delete their own fraud rings"
ON public.fraud_rings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);