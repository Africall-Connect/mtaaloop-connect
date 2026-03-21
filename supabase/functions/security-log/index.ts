import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse, getClientIP } from "../_shared/rateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);

    // Rate limit: 30 log events per minute per IP
    const rateCheck = await checkRateLimit({
      action: "security-log",
      identifier: clientIP,
      maxRequests: 30,
      windowSeconds: 60,
    });

    if (!rateCheck.allowed) {
      return createRateLimitResponse(corsHeaders, rateCheck.retryAfterSeconds);
    }

    const body = await req.json();
    const { event_type, user_id, metadata, severity } = body;

    // Validate event_type
    if (!event_type || typeof event_type !== "string" || event_type.length > 100) {
      return new Response(
        JSON.stringify({ error: "event_type is required and must be under 100 chars" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user_id if provided
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (user_id && (typeof user_id !== "string" || !UUID_RE.test(user_id))) {
      return new Response(
        JSON.stringify({ error: "Invalid user_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedEvents = [
      "login_success", "login_failure", "signup", "signup_failure",
      "password_reset_request", "password_reset_complete",
      "session_expired", "suspicious_activity", "rate_limited",
    ];

    if (!allowedEvents.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userAgent = req.headers.get("user-agent") || "unknown";

    const { error } = await supabaseAdmin.from("security_logs").insert({
      event_type,
      user_id: user_id || null,
      ip_address: clientIP,
      user_agent: userAgent.substring(0, 500), // Truncate
      metadata: metadata || {},
      severity: severity || "info",
    });

    if (error) {
      console.error("[security-log] Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to log event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[security-log] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
