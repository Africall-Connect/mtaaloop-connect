// supabase/functions/payments-paystack-webhook/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Verify Paystack signature using HMAC SHA512
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");
  return hash === signature;
}

// Small helper to log into payment_logs
async function logPaymentEvent(params: {
  event_type: string;
  provider?: string;
  order_id?: string | null;
  payment_id?: string | null;
  external_reference?: string | null;
  payload?: unknown;
  message?: string;
}) {
  const {
    event_type,
    provider = "paystack",
    order_id = null,
    payment_id = null,
    external_reference = null,
    payload = null,
    message = null,
  } = params;

  await supabaseAdmin.from("payment_logs").insert({
    event_type,
    provider,
    order_id,
    payment_id,
    external_reference,
    payload,
    message,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("x-paystack-signature");
  const bodyText = await req.text();

  try {
    // 1️⃣ Security: verify webhook signature
    const valid = verifySignature(bodyText, signature);
    if (!valid) {
      await logPaymentEvent({
        event_type: "webhook_error",
        message: "Invalid Paystack signature",
        payload: bodyText,
      });

      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const event = JSON.parse(bodyText);
    const data = event.data;

    // We only care about successful charges for now
    if (event.event !== "charge.success") {
      await logPaymentEvent({
        event_type: "webhook_ignored",
        external_reference: data?.reference,
        payload: event,
        message: `Ignored event type: ${event.event}`,
      });

      return new Response(JSON.stringify({ ignored: true }), {
        headers: corsHeaders,
      });
    }

    const reference: string = data.reference;
    const amountKobo: number = data.amount; // Paystack sends in kobo
    const amount = amountKobo / 100;

    // 2️⃣ Look up payment by provider + reference
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("provider", "paystack")
      .eq("provider_reference", reference)
      .single();

    if (paymentError || !payment) {
      await logPaymentEvent({
        event_type: "webhook_error",
        external_reference: reference,
        payload: event,
        message: `Payment not found for reference: ${reference}`,
      });

      return new Response(
        JSON.stringify({ error: "payment_not_found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 3️⃣ Idempotency: if already successful, do nothing
    if (payment.status === "successful") {
      await logPaymentEvent({
        event_type: "webhook_idempotent",
        payment_id: payment.id,
        order_id: payment.order_id,
        external_reference: reference,
        payload: event,
        message: "Payment already marked successful; skipping.",
      });

      return new Response(JSON.stringify({ already_processed: true }), {
        headers: corsHeaders,
      });
    }

    // 4️⃣ Update payments → successful
    const { error: updatePaymentError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "successful",
        amount, // ensure we store actual amount from Paystack
        raw_payload: data,
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      await logPaymentEvent({
        event_type: "webhook_error",
        payment_id: payment.id,
        order_id: payment.order_id,
        external_reference: reference,
        payload: event,
        message: `Error updating payment: ${updatePaymentError.message}`,
      });

      return new Response(
        JSON.stringify({ error: "payment_update_failed" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 5️⃣ Update orders → paid + payment_status/paid_at if you use those
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, vendor_id, total_amount")
      .eq("id", payment.order_id)
      .single();

    if (orderError || !order) {
      await logPaymentEvent({
        event_type: "webhook_error",
        payment_id: payment.id,
        order_id: payment.order_id,
        external_reference: reference,
        payload: event,
        message: `Order not found for payment.order_id: ${payment.order_id}`,
      });

      return new Response(
        JSON.stringify({ error: "order_not_found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    const { error: orderUpdateError } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (orderUpdateError) {
      await logPaymentEvent({
        event_type: "webhook_error",
        payment_id: payment.id,
        order_id: order.id,
        external_reference: reference,
        payload: event,
        message: `Error updating order: ${orderUpdateError.message}`,
      });

      return new Response(
        JSON.stringify({ error: "order_update_failed" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 6️⃣ Vendor payout creation (if vendor_id exists)
    if (order.vendor_id) {
      const vendorShare = order.total_amount * 0.8; // 80% vendor
      const platformFee = order.total_amount * 0.2; // 20% platform

      // Try insert; if unique constraint on order_id exists, this will error once
      const { error: payoutError } = await supabaseAdmin
        .from("vendor_payouts")
        .insert({
          vendor_id: order.vendor_id,
          order_id: order.id,
          amount: vendorShare,
          platform_fee: platformFee,
          status: "pending",
        });

      if (payoutError) {
        // Expected if already created for this order (idempotent)
        await logPaymentEvent({
          event_type: "payout_error",
          order_id: order.id,
          payment_id: payment.id,
          external_reference: reference,
          payload: { payoutError },
          message: `Error inserting vendor payout (may be duplicate): ${payoutError.message}`,
        });
      } else {
        await logPaymentEvent({
          event_type: "payout_created",
          order_id: order.id,
          payment_id: payment.id,
          external_reference: reference,
          payload: {
            vendor_id: order.vendor_id,
            vendorShare,
            platformFee,
          },
          message: "Vendor payout row created.",
        });
      }
    }

    await logPaymentEvent({
      event_type: "webhook_success",
      payment_id: payment.id,
      order_id: order.id,
      external_reference: reference,
      payload: event,
      message: "Paystack charge.success processed successfully",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Unhandled webhook error", err);

    await logPaymentEvent({
      event_type: "webhook_unhandled_error",
      message: (err as Error).message,
    });

    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
