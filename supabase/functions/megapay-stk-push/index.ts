import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const MEGAPAY_API_URL = "https://megapay.co.ke/backend/v1"
const MEGAPAY_API_KEY = Deno.env.get("MEGAPAY_API_KEY") || ""
const MEGAPAY_EMAIL = Deno.env.get("MEGAPAY_EMAIL") || ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, phoneNumber, amount, reference, transactionRequestId } = body

    // ─── Transaction Status Check ───
    if (action === "status" && transactionRequestId) {
      const response = await fetch(`${MEGAPAY_API_URL}/transactionstatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: MEGAPAY_API_KEY,
          email: MEGAPAY_EMAIL,
          transaction_request_id: transactionRequestId,
        }),
      })

      const data = await response.json()

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // ─── Initiate STK Push ───
    if (!phoneNumber || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Format phone number
    let msisdn = phoneNumber.replace(/\D/g, "")
    if (msisdn.startsWith("0")) msisdn = "254" + msisdn.slice(1)
    if (!msisdn.startsWith("254")) msisdn = "254" + msisdn

    const stkResponse = await fetch(`${MEGAPAY_API_URL}/initiatestk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: MEGAPAY_API_KEY,
        email: MEGAPAY_EMAIL,
        amount: String(Math.ceil(amount)),
        msisdn: msisdn,
        reference: reference || String(Date.now()),
      }),
    })

    const stkData = await stkResponse.json()

    if (stkData.success === "200" || stkData.transaction_request_id) {
      return new Response(
        JSON.stringify({
          success: true,
          transaction_request_id: stkData.transaction_request_id,
          message: stkData.massage || "STK push sent",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: stkData.massage || stkData.message || "Failed to initiate STK push",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
