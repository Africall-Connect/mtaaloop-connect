import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAuth, createUnauthorizedResponse } from "../_shared/auth.ts";
import { checkRateLimit, createRateLimitResponse, getClientIP } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔐 JWT Verification
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.userId) {
      return createUnauthorizedResponse(
        authResult.error || "Authentication required",
        corsHeaders
      );
    }

    // 🛡️ Rate limit: 10 generations per 5 minutes per user
    const rateCheck = await checkRateLimit({
      action: "ai-image",
      identifier: authResult.userId,
      maxRequests: 10,
      windowSeconds: 300,
    });

    if (!rateCheck.allowed) {
      console.warn(`[generate-image] Rate limited user: ${authResult.userId}`);
      return createRateLimitResponse(corsHeaders, rateCheck.retryAfterSeconds);
    }

    // Also rate limit by IP to prevent multi-account abuse
    const clientIP = getClientIP(req);
    const ipCheck = await checkRateLimit({
      action: "ai-image-ip",
      identifier: clientIP,
      maxRequests: 20,
      windowSeconds: 300,
    });

    if (!ipCheck.allowed) {
      console.warn(`[generate-image] IP rate limited: ${clientIP}`);
      return createRateLimitResponse(corsHeaders, ipCheck.retryAfterSeconds);
    }

    console.log(`[generate-image] Request from user: ${authResult.userId}`);

    const { prompt, model = "google/gemini-2.5-flash-image" } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: "Prompt is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize prompt length
    if (prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Prompt must be under 2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating image with model: ${model}, prompt: ${prompt.substring(0, 100)}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const text = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      console.error("No image URL in response", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to generate image", text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Image generated successfully for user: ${authResult.userId}`);

    return new Response(
      JSON.stringify({ imageUrl, text, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-image function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
