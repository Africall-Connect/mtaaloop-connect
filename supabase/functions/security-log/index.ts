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

    const { event_type, user_id, metadata, severity } = await req.json();

    if (!event_type || typeof event_type !== "string") {
      return new Response(
        JSON.stringify({ error: "event_type is required" }),
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
