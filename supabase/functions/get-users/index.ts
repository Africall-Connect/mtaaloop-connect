import { createClient } from "npm:@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin, createUnauthorizedResponse } from "../_shared/auth.ts";
import { checkRateLimit, createRateLimitResponse, getClientIP } from "../_shared/rateLimit.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🛡️ Rate limit by IP: 30 requests per minute
    const clientIP = getClientIP(req);
    const rateCheck = await checkRateLimit({
      action: "get-users",
      identifier: clientIP,
      maxRequests: 30,
      windowSeconds: 60,
    });

    if (!rateCheck.allowed) {
      console.warn(`[get-users] IP rate limited: ${clientIP}`);
      return createRateLimitResponse(corsHeaders, rateCheck.retryAfterSeconds);
    }

    // 🔐 Require admin role via JWT
    const adminCheck = await requireAdmin(req, corsHeaders);
    if (adminCheck instanceof Response) {
      return adminCheck;
    }

    console.log(`[get-users] Admin user ${adminCheck.userId} listing users`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("[get-users] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
