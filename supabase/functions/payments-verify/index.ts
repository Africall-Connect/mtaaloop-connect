import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let reference: string | null = url.searchParams.get("reference");

    if (!reference && req.method !== "GET") {
      const body = await req.json().catch(() => null);
      reference = body?.reference ?? null;
    }

    if (!reference) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing payment reference",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1️⃣ Find the payment for this Paystack reference
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, status, provider, amount, provider_reference, created_at, updated_at")
      .eq("provider", "paystack")
      .eq("provider_reference", reference)
      .maybeSingle();

    if (paymentError) {
      console.error("[payments-verify] paymentError", paymentError);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Error looking up payment",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payment) {
      return new Response(
        JSON.stringify({
          status: "not_found",
          message: "No payment found for this reference",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ Fetch related order (if any)
    let order = null;
    if (payment.order_id) {
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, status, payment_status, paid_at, total_amount, vendor_id")
        .eq("id", payment.order_id)
        .maybeSingle();

      if (orderError) {
        console.error("[payments-verify] orderError", orderError);
      } else {
        order = orderData;
      }
    }

    // 3️⃣ Normalize a simple status for the frontend
    // You can tweak this mapping if needed
    let normalizedStatus: "success" | "pending" | "failed" | "error" = "pending";

    if (payment.status === "successful") {
      // If order is also marked paid, we consider this a full success
      if (order?.payment_status === "paid" || order?.status === "paid") {
        normalizedStatus = "success";
      } else {
        // Payment says success but order not yet updated – treat as pending but OK
        normalizedStatus = "pending";
      }
    } else if (payment.status === "failed" || payment.status === "cancelled") {
      normalizedStatus = "failed";
    } else if (payment.status === "initiated" || payment.status === "pending") {
      normalizedStatus = "pending";
    } else {
      normalizedStatus = "error";
    }

    return new Response(
      JSON.stringify({
        status: normalizedStatus,
        payment,
        order,
        message:
          normalizedStatus === "success"
            ? "Payment confirmed"
            : normalizedStatus === "pending"
            ? "Payment is still processing"
            : normalizedStatus === "failed"
            ? "Payment failed or was cancelled"
            : "Unknown payment status",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[payments-verify] Unhandled error", err);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal error verifying payment",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
