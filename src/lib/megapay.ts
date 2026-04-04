import { supabase } from '@/integrations/supabase/client';

interface STKPushResponse {
  success: boolean;
  transaction_request_id?: string;
  error?: string;
}

interface TransactionStatusResponse {
  ResultCode: string;
  ResultDesc: string;
  TransactionID: string;
  TransactionStatus: string;
  TransactionCode: string;
  TransactionReceipt: string;
  TransactionAmount: string;
  Msisdn: string;
  TransactionDate: string;
  TransactionReference: string;
}

/**
 * Initiate M-Pesa STK Push via MegaPay API (through Edge Function proxy)
 */
export async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  reference: string
): Promise<STKPushResponse> {
  const { data, error } = await supabase.functions.invoke('megapay-stk-push', {
    body: { phoneNumber, amount, reference },
  });

  if (error) {
    return { success: false, error: error.message || 'Failed to initiate payment' };
  }

  return data;
}

/**
 * Check M-Pesa transaction status via MegaPay API (through Edge Function proxy)
 */
export async function checkTransactionStatus(
  transactionRequestId: string
): Promise<TransactionStatusResponse | null> {
  const { data, error } = await supabase.functions.invoke('megapay-stk-push', {
    body: { action: 'status', transactionRequestId },
  });

  if (error) return null;
  return data;
}

/**
 * Poll for payment completion.
 * Returns true if paid, false if cancelled/failed, null if still pending.
 */
export async function pollPaymentStatus(
  orderId: string,
  maxAttempts = 30,
  intervalMs = 3000
): Promise<'paid' | 'failed' | 'timeout'> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));

    const { data } = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single();

    if (data?.payment_status === 'paid') return 'paid';
    if (data?.payment_status === 'failed') return 'failed';
  }
  return 'timeout';
}

/**
 * Format phone number for M-Pesa (ensure 254 prefix)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}
