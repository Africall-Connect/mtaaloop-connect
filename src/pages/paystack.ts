import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

async function callPaystack(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*";

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  // 🔒 TODO: implement proper admin auth here (e.g. Supabase JWT check or custom API key)
  const apiKey = req.headers.get("x-admin-key");
  if (apiKey !== Deno.env.get("ADMIN_API_KEY")) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders(origin) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    // 1) Fetch order + vendor info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        vendor_payout_amount,
        vendor_id,
        payment_status,
        vendor_profiles (
          id,
          name,
          bank_account_number,
          bank_code,
          paystack_recipient_code
        )
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("[paystack-payout] Order fetch error", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    if (order.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Order not paid yet" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    const payoutAmount = Number(order.vendor_payout_amount || 0);
    if (!payoutAmount || payoutAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payout amount" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    const vendor = order.vendor_profiles;
    if (!vendor) {
      return new Response(
        JSON.stringify({ error: "Vendor profile not found" }),
        { status: 404, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    if (!vendor.bank_account_number || !vendor.bank_code) {
      return new Response(
        JSON.stringify({ error: "Vendor bank details not set" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    let recipientCode = vendor.paystack_recipient_code;

    // 2) Create recipient if needed
    if (!recipientCode) {
      const { ok, data } = await callPaystack("/transferrecipient", {
        type: "nuban",
        name: vendor.name || `Vendor ${vendor.id}`,
        account_number: vendor.bank_account_number,
        bank_code: vendor.bank_code,
        currency: "NGN", // or your currency
      });

      if (!ok) {
        console.error("[paystack-payout] transferrecipient error", data);
        return new Response(
          JSON.stringify({ error: "Failed to create transfer recipient" }),
          { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
        );
      }

      recipientCode = data.data.recipient_code;

      const { error: updateVendorError } = await supabase
        .from("vendor_profiles")
        .update({ paystack_recipient_code: recipientCode })
        .eq("id", vendor.id);

      if (updateVendorError) {
        console.error("[paystack-payout] vendor update error", updateVendorError);
      }
    }

    // 3) Initiate transfer
    const amountKobo = Math.round(payoutAmount * 100);
    const { ok: transferOk, data: transferData } = await callPaystack("/transfer", {
      source: "balance",
      amount: amountKobo,
      recipient: recipientCode,
      reason: `Payout for order ${order.id}`,
    });

    // 4) Log result
    await supabase.from("payment_logs").insert({
      order_id: order.id,
      provider: "paystack",
      event_type: "vendor_payout",
      status: transferOk ? "pending" : "failed",
      reference: transferOk ? transferData.data.reference : null,
      amount: payoutAmount,
      raw_payload: transferData,
    });

    if (!transferOk) {
      console.error("[paystack-payout] transfer error", transferData);
      return new Response(
        JSON.stringify({ error: "Paystack transfer failed" }),
        { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, transfer: transferData }),
      { status: 200, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[paystack-payout] Fatal error", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
    );
  }
});