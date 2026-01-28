import { supabase } from "@/lib/supabaseClient";

export async function retryPaystackPayment(orderId: string) {
  const { data, error } = await supabase.functions.invoke("payments-paystack-init", {
    body: { order_id: orderId },
  });

  if (error) {
    console.error("Retry Paystack error:", error);
    return { success: false, message: "Failed to retry payment." };
  }

  const { authorization_url } = data as { authorization_url: string; reference: string };

  if (!authorization_url) {
    return { success: false, message: "No authorization URL returned from Paystack." };
  }

  window.location.href = authorization_url;
  return { success: true };
}