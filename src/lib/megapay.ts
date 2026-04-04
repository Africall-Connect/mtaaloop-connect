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
 * Initiate M-Pesa STK Push via MegaPay API (through Edge Function proxy).
 * Does NOT create an order — just sends the STK push.
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
 * Check M-Pesa transaction status via MegaPay API (through Edge Function proxy).
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
 * Poll MegaPay transaction status until completed, failed, or timeout.
 * This polls the MegaPay API directly (no order needed in DB yet).
 */
export async function pollMpesaTransaction(
  transactionRequestId: string,
  maxAttempts = 40,
  intervalMs = 3000
): Promise<{ status: 'paid' | 'failed' | 'timeout'; receipt?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));

    const result = await checkTransactionStatus(transactionRequestId);
    if (!result) continue;

    // MegaPay returns TransactionCode "0" for success
    if (result.TransactionStatus === 'Completed' || result.TransactionCode === '0') {
      return { status: 'paid', receipt: result.TransactionReceipt };
    }

    // Any non-zero code means failed/cancelled
    if (result.ResultCode && result.ResultCode !== '200' && result.TransactionStatus) {
      // If TransactionStatus exists and is not pending, it's done
      if (result.TransactionStatus !== 'Pending' && result.TransactionStatus !== 'Processing') {
        return { status: 'failed' };
      }
    }
  }
  return { status: 'timeout' };
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
