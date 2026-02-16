// supabase/functions/payments-paystack-init/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const callback_url = `${Deno.env.get("SITE_URL") || "https://mtaaloop.plugin.ke"}/payment/callback`;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  },
});

// Helper function to create a response with CORS headers
const corsResponse = (body: any, status: number) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
};

serve(async (req) => {
  try {
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    if (req.method !== "POST") {
      return corsResponse({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return corsResponse({ error: "Invalid JSON body" }, 400);
    }

    const { order_id, retry } = body;

    if (!order_id) {
      return corsResponse({ error: "order_id is required" }, 400);
    }

    // 1) Load order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, estate_id, vendor_id, customer_id, payment_status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("[paystack-init] Order fetch error", orderError);
      return corsResponse({ error: "Order not found" }, 404);
    }

    // 2) Hard guard: don't init again if order is already paid
    if (order.payment_status === "paid") {
      return corsResponse(
        {
          error: "Order is already paid",
          code: "ORDER_ALREADY_PAID",
        },
        400
      );
    }

    // 3) Also check payments table for successful payment (extra safety)
    const { data: existingPayments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("id, status, provider_reference, raw_payload")
      .eq("order_id", order_id)
      .eq("provider", "paystack");

    if (paymentsError) {
      console.error("[paystack-init] Existing payments fetch error", paymentsError);
    }

    const successfulPayment = existingPayments?.find(
      (p: any) => p.status === "successful"
    );

    if (successfulPayment) {
      return corsResponse(
        {
          error: "Payment already completed for this order",
          code: "PAYMENT_ALREADY_SUCCESSFUL",
        },
        400
      );
    }

    // Optional: if not retry, you can block when a pending attempt exists
    const pendingPayment = existingPayments?.find((p: any) =>
      ["initiated", "pending"].includes(p.status)
    );

    if (pendingPayment && !retry) {
      // You COULD reuse the previous authorization_url if you stored it
      // in raw_payload; for now we just return an error to avoid
      // spamming new attempts.
      return corsResponse(
        {
          error: "There is already a pending payment attempt",
          code: "PAYMENT_ALREADY_PENDING",
        },
        409
      );
    }

    // 4) Create a new payment row (this is the "retry-safe" part)
    const amountNumber = Number(order.total_amount ?? 0);
    if (!amountNumber || amountNumber <= 0) {
      return corsResponse({ error: "Invalid order amount" }, 400);
    }

    const { data: payment, error: paymentInsertError } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id,
        provider: "paystack",
        status: "initiated",
        amount: amountNumber,
        currency: "KES",
      })
      .select("id")
      .single();

    if (paymentInsertError || !payment) {
      console.error("[paystack-init] Error inserting payment", paymentInsertError);
      return corsResponse({ error: "Failed to create payment record" }, 500);
    }

    // 5) Call Paystack initialize endpoint
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Paystack expects amount in kobo (x100)
          amount: Math.round(amountNumber * 100),
          email: "no-email@mtaaloop.com", // optionally replace with real customer email
          reference: order_id,
callback_url: `${Deno.env.get("SITE_URL") || "https://mtaaloop.plugin.ke"}/orders/${order_id}`,
          metadata: {
            order_id,
            vendor_id: order.vendor_id,
            estate_id: order.estate_id,
            retry: !!retry,
          },
        }),
      }
    );

    const paystackJson = await paystackRes.json().catch(() => null as any);

    if (!paystackRes.ok || !paystackJson?.status) {
      console.error("[paystack-init] Paystack init failed", paystackJson);

      // Mark this payment as failed
      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          raw_payload: paystackJson ?? null,
        })
        .eq("id", payment.id);

      return corsResponse(
        {
          error: "Failed to initialize Paystack transaction",
          provider_error: paystackJson,
        },
        502
      );
    }

    const authUrl = paystackJson.data?.authorization_url;
    const reference = paystackJson.data?.reference;

    // 6) Update payment with provider_reference + pending status
    await supabaseAdmin
      .from("payments")
      .update({
        status: "pending",
        provider_reference: reference,
        raw_payload: paystackJson?.data ?? paystackJson ?? null,
      })
      .eq("id", payment.id);

    return corsResponse(
      {
        authorization_url: authUrl,
        reference: reference,
        payment_id: payment.id,
      },
      200
    );
  } catch (err) {
    console.error("[paystack-init] Unexpected error", err);
    return corsResponse({ error: "Internal server error" }, 500);
  }
});
