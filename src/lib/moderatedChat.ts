import { supabase } from "@/integrations/supabase/client";

export type ModeratedRole =
  | "customer"
  | "vendor"
  | "rider"
  | "agent";

/**
 * Open (or reuse) a chat that will be moderated by CSR.
 *
 * All customer ↔ staff conversations (vendor, rider, agent) route through
 * CSR. The chat is created with:
 *   initiator_id   = current user
 *   initiator_role = user's role
 *   recipient_id   = null        (unassigned — lands in CSR queue)
 *   recipient_role = 'customer_rep'
 *
 * Returns the chat_id so caller can deeplink to /inbox?chat=<id>.
 *
 * NOTE: Live support (SupportLiveChat / Help & Support) keeps its own
 * separate code path — it already routes to CSR the same way.
 */
export async function openModeratedChat(
  userId: string,
  role: ModeratedRole,
  opts?: { contextLabel?: string }
): Promise<string> {
  // Look for an existing open moderated chat for this user
  const { data: existing } = await (supabase.from("private_chats") as any)
    .select("chat_id")
    .eq("initiator_id", userId)
    .eq("initiator_role", role)
    .eq("recipient_role", "customer_rep")
    .eq("is_closed", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    return (existing[0] as any).chat_id as string;
  }

  const { data: created, error } = await (supabase.from("private_chats") as any)
    .insert({
      initiator_id: userId,
      initiator_role: role,
      recipient_id: null,
      recipient_role: "customer_rep",
      is_closed: false,
    })
    .select("chat_id")
    .single();

  if (error) throw error;
  const chatId = (created as { chat_id: string }).chat_id;

  // Optional: seed first message with the context (order id, task id, etc.)
  if (opts?.contextLabel) {
    await (supabase.from("private_chat_messages") as any).insert({
      chat_id: chatId,
      sender_id: userId,
      sender_role: role,
      content: `[Context] ${opts.contextLabel}`,
    });
  }

  return chatId;
}
