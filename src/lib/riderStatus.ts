import { supabase } from '../integrations/supabase/client';

export async function getCurrentRiderStatus() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("rider_status")
    .select("online, last_online_at")
    .eq("rider_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;

  // if no row yet, create default offline row
  if (!data) {
    const { error: insertError } = await supabase.from("rider_status").insert({
      rider_id: userData.user.id,
      online: false,
      last_online_at: null,
    });
    if (insertError) throw insertError;
    return { online: false, last_online_at: null };
  }

  return data;
}

export async function setRiderOnlineStatus(online: boolean) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Not authenticated");

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("rider_status")
    .upsert({
      rider_id: userData.user.id,
      online,
      last_online_at: online ? now : null,
      updated_at: now,
    });

  if (error) throw error;

  return { online, last_online_at: online ? now : null };
}
