
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'investigator');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Detection config (singleton)
CREATE TABLE public.detection_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_depth int NOT NULL DEFAULT 4,
  fan_in_threshold int NOT NULL DEFAULT 10,
  shell_chain_length int NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.detection_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read config"
  ON public.detection_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert config"
  ON public.detection_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update config"
  ON public.detection_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.detection_config (cycle_depth, fan_in_threshold, shell_chain_length)
VALUES (4, 10, 3);

-- Trusted accounts whitelist
CREATE TABLE public.trusted_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_ref text NOT NULL UNIQUE,
  reason text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trusted_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read whitelist"
  ON public.trusted_accounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can add whitelist"
  ON public.trusted_accounts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete whitelist"
  ON public.trusted_accounts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin global visibility on existing tables
CREATE POLICY "Admins can view all uploads"
  ON public.analysis_uploads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all accounts"
  ON public.accounts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all fraud rings"
  ON public.fraud_rings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
