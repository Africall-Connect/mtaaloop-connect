
-- Security audit log for authentication events and suspicious activity
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by event type and time
CREATE INDEX idx_security_logs_event ON public.security_logs(event_type, created_at DESC);
CREATE INDEX idx_security_logs_user ON public.security_logs(user_id, created_at DESC);
CREATE INDEX idx_security_logs_severity ON public.security_logs(severity, created_at DESC);

-- RLS: only admins can read, service role writes
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
  ON public.security_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-cleanup old logs (keep 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_security_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.security_logs
  WHERE created_at < now() - interval '90 days';
$$;
