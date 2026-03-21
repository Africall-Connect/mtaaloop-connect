
-- Rate limiting table for server-side abuse protection
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE(key)
);

-- No RLS needed - only accessed via security definer function
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup: index for efficient expiry queries
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Core rate limit check function (security definer, no RLS bypass needed)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  -- Try to get existing record
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE key = p_key;

  IF NOT FOUND THEN
    -- First request for this key
    INSERT INTO rate_limits (key, window_start, request_count)
    VALUES (p_key, now(), 1)
    ON CONFLICT (key) DO UPDATE
    SET request_count = rate_limits.request_count + 1;
    RETURN true;
  END IF;

  -- Check if window has expired, reset if so
  IF v_window_start < (now() - (p_window_seconds || ' seconds')::interval) THEN
    UPDATE rate_limits
    SET window_start = now(), request_count = 1
    WHERE key = p_key;
    RETURN true;
  END IF;

  -- Window still active, check count
  IF v_count >= p_max_requests THEN
    RETURN false; -- Rate limited
  END IF;

  -- Increment
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE key = p_key;

  RETURN true;
END;
$$;

-- Cleanup old entries (run periodically or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
$$;
