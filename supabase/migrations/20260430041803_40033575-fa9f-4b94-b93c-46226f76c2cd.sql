-- Create status enum
CREATE TYPE public.investigation_status AS ENUM ('none', 'verified', 'under_review');

-- Create investigation_notes table
CREATE TABLE public.investigation_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  analysis_upload_id UUID,
  notes TEXT NOT NULL DEFAULT '',
  status public.investigation_status NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_id)
);

-- Enable RLS
ALTER TABLE public.investigation_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own investigation notes"
  ON public.investigation_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investigation notes"
  ON public.investigation_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investigation notes"
  ON public.investigation_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigation notes"
  ON public.investigation_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_investigation_notes_user_account
  ON public.investigation_notes (user_id, account_id);

-- Auto-update updated_at
CREATE TRIGGER update_investigation_notes_updated_at
  BEFORE UPDATE ON public.investigation_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();