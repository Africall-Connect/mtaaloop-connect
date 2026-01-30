import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAuth, createUnauthorizedResponse, createForbiddenResponse } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    const userId = authResult.userId;

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch the order to get the amount and user details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("total_amount, user_email, customer_id")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Failed to fetch order:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🔐 Ownership check: user must own the order
    if (order.customer_id !== userId) {
      console.warn(`[payments-init] User ${userId} tried to pay for order owned by ${order.customer_id}`);
      return createForbiddenResponse(
        "You can only pay for your own orders",
        corsHeaders
      );
    }

    // 2. Resolve user email - from order first, then fallback to auth.users
    let userEmail = order.user_email;
    
    if (!userEmail && order.customer_id) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(order.customer_id);
      if (!userError && userData?.user?.email) {
        userEmail = userData.user.email;
      }
    }

    if (!userEmail) {
      console.error("No email found for order:", order_id);
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create a new payment record
    const { data: payment, error: paymentInsertError } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: order_id,
        provider: "paystack",
        amount: order.total_amount,
        currency: "KES",
        status: "initiated",
      })
      .select()
      .single();

    if (paymentInsertError) {
      console.error("Failed to create payment record:", paymentInsertError);
      return new Response(JSON.stringify({ error: "Could not initiate payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Initialize transaction with Paystack
    const callbackUrl = `${Deno.env.get("SITE_URL") || "https://mtaa-loop-connect.vercel.app"}/payment/callback`;
    
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: order.total_amount * 100, // Amount in kobo
        currency: "KES",
        reference: payment.id,
        callback_url: callbackUrl,
        metadata: { order_id: order_id },
      }),
    });

    const paystackData = await paystackResponse.json();
    if (!paystackResponse.ok || !paystackData.status) {
      console.error("Paystack API error:", paystackData);
      return new Response(JSON.stringify({ error: "Failed to initialize Paystack transaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Update our payment record with the Paystack reference
    await supabaseAdmin
      .from("payments")
      .update({ provider_reference: paystackData.data.reference, status: "pending" })
      .eq("id", payment.id);

    // 5. Return the authorization URL to the frontend
    return new Response(JSON.stringify(paystackData.data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in payments-paystack-init:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
