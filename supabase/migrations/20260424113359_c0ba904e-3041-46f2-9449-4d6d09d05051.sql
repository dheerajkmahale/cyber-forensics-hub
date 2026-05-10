CREATE TABLE IF NOT EXISTS public.analysis_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT,
  file_sha256 TEXT,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  account_count INTEGER NOT NULL DEFAULT 0,
  suspicious_count INTEGER NOT NULL DEFAULT 0,
  fraud_ring_count INTEGER NOT NULL DEFAULT 0,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_uploads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_analysis_uploads_user_created
ON public.analysis_uploads (user_id, created_at DESC);

DROP POLICY IF EXISTS "Users can view their own analysis uploads" ON public.analysis_uploads;
CREATE POLICY "Users can view their own analysis uploads"
ON public.analysis_uploads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own analysis uploads" ON public.analysis_uploads;
CREATE POLICY "Users can create their own analysis uploads"
ON public.analysis_uploads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_upload_id UUID REFERENCES public.analysis_uploads(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_analysis_upload
ON public.audit_logs (analysis_upload_id);

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can create their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();