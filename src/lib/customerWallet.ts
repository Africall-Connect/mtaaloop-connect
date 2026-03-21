import { supabase } from '@/integrations/supabase/client';

export interface WalletBalance {
  balance: number;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string | null;
  order_id: string | null;
  reference: string | null;
  created_at: string;
}

/** Get or create the current user's wallet balance */
export async function getWalletBalance(): Promise<number> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('customer_wallet')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  // If no wallet exists yet, create one
  if (!data) {
    const { data: newWallet, error: createErr } = await supabase
      .from('customer_wallet')
      .insert({ user_id: user.id, balance: 0 })
      .select('balance')
      .single();
    if (createErr) throw createErr;
    return newWallet.balance;
  }

  return data.balance;
}

/** Get transaction history for the current user */
export async function getWalletTransactions(limit = 50): Promise<WalletTransaction[]> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('customer_wallet_tx')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as WalletTransaction[];
}

/** Debit wallet for an order payment (uses atomic DB function) */
export async function debitWallet(amount: number, orderId?: string, description = 'Order payment'): Promise<boolean> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('debit_customer_wallet', {
    p_user_id: user.id,
    p_amount: amount,
    p_description: description,
    p_order_id: orderId || null,
  });

  if (error) throw error;
  return data as boolean;
}

/** Credit wallet (top-up, refund, cashback) */
export async function creditWallet(amount: number, description = 'Top-up', orderId?: string, reference?: string): Promise<boolean> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('credit_customer_wallet', {
    p_user_id: user.id,
    p_amount: amount,
    p_description: description,
    p_order_id: orderId || null,
    p_reference: reference || null,
  });

  if (error) throw error;
  return data as boolean;
}
