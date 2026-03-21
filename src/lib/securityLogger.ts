import { supabase } from '@/integrations/supabase/client';

type SecurityEvent =
  | 'login_success'
  | 'login_failure'
  | 'signup'
  | 'signup_failure'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'session_expired'
  | 'suspicious_activity'
  | 'rate_limited';

interface LogOptions {
  event_type: SecurityEvent;
  user_id?: string;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warn' | 'critical';
}

/**
 * Fire-and-forget security event logger.
 * Sends to the security-log edge function; never blocks the UI.
 */
export function logSecurityEvent(options: LogOptions): void {
  const { event_type, user_id, metadata = {}, severity = 'info' } = options;

  // Fire and forget - don't await
  supabase.functions
    .invoke('security-log', {
      body: { event_type, user_id, metadata, severity },
    })
    .then(({ error }) => {
      if (error) {
        console.warn('[security] Failed to log event:', event_type, error.message);
      }
    })
    .catch(() => {
      // Silent fail - logging should never break the app
    });
}
