import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const data = await req.json()
    console.log("MegaPay webhook received:", JSON.stringify(data))

    const {
      ResponseCode,
      TransactionID,
      TransactionAmount,
      TransactionReceipt,
      Msisdn,
      TransactionReference,
    } = data

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find the order by payment_reference (TransactionID stored during STK push)
    // or by TransactionReference (order ID passed as reference)
    let orderId = TransactionReference

    // Try to find order by payment_reference
    if (TransactionID) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_reference", TransactionID)
        .maybeSingle()

      if (order) orderId = order.id
    }

    if (ResponseCode === 0) {
      // ─── Payment Successful ───
      if (orderId) {
        // Update regular orders
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            payment_channel: "mpesa",
            payment_provider: "megapay",
            payment_reference: TransactionReceipt || TransactionID,
            paid_at: new Date().toISOString(),
          })
          .eq("id", orderId)

        // Also try premium_orders
        await supabase
          .from("premium_orders")
          .update({
            payment_status: "paid",
            payment_method: "mpesa",
          })
          .eq("id", orderId)

        console.log(`Payment successful for order ${orderId}: KES ${TransactionAmount}, Receipt: ${TransactionReceipt}`)
      }
    } else {
      // ─── Payment Failed ───
      if (orderId) {
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            payment_reference: TransactionID,
          })
          .eq("id", orderId)

        await supabase
          .from("premium_orders")
          .update({
            payment_status: "failed",
          })
          .eq("id", orderId)

        console.log(`Payment failed for order ${orderId}: Code ${ResponseCode}`)
      }
    }

    return new Response(
      JSON.stringify({ status: "received" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
