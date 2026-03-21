import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RateLimitConfig {
  /** Unique prefix for this endpoint, e.g. "login", "signup", "ai-gen" */
  action: string;
  /** Identifier: IP address, user ID, or combination */
  identifier: string;
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Server-side rate limiter using the rate_limits table.
 * Call this at the top of edge functions before processing.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const key = `${config.action}:${config.identifier}`;

  try {
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_key: key,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      console.error("[rateLimit] DB error:", error);
      // Fail open to avoid blocking legitimate users on DB errors
      return { allowed: true };
    }

    return {
      allowed: data === true,
      retryAfterSeconds: data === true ? undefined : config.windowSeconds,
    };
  } catch (err) {
    console.error("[rateLimit] Unexpected error:", err);
    return { allowed: true }; // Fail open
  }
}

/**
 * Create a rate-limited error response with proper headers.
 */
export function createRateLimitResponse(
  corsHeaders: Record<string, string>,
  retryAfterSeconds: number = 60
): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retry_after_seconds: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

/**
 * Extract client IP from request headers (works behind proxies).
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
