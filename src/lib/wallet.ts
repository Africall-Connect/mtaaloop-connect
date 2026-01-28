import { supabase } from '../integrations/supabase/client';

export async function getMyWallet() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("rider_wallet")
    .select("balance")
    .eq("rider_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
