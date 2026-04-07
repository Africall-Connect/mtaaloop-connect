import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "vendor" | "rider" | "agent" | "customer_rep" | "admin";

/**
 * Find or create a private chat between a staff user (vendor, rider, agent,
 * CSR, or admin) and a customer.
 *
 * Behaviour:
 * - Look for an existing OPEN chat where the customer is the initiator and
 *   either there's no recipient or the recipient is this staff user.
 * - If one exists, claim it (set this staff user as recipient) and return id.
 * - Otherwise create a new chat with the customer as initiator and the staff
 *   user as recipient (so the customer keeps seeing it in their own inbox).
 *
 * Returns the chat_id, or throws on failure.
 */
export async function findOrCreateChatWithCustomer(
  staffId: string,
  customerId: string,
  staffRole: StaffRole = "customer_rep"
): Promise<string> {
  // 1. Look for an existing open chat
  const { data: existing } = await (supabase.from("private_chats") as any)
    .select("chat_id, recipient_id")
    .eq("initiator_id", customerId)
    .eq("is_closed", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const rows = (existing as Array<{ chat_id: string; recipient_id: string | null }>) || [];

  // Prefer one already assigned to this staff user
  const mine = rows.find(r => r.recipient_id === staffId);
  if (mine) return mine.chat_id;

  // Otherwise an unassigned one we can claim
  const unassigned = rows.find(r => !r.recipient_id);
  if (unassigned) {
    const { error: claimError } = await (supabase.from("private_chats") as any)
      .update({ recipient_id: staffId, recipient_role: staffRole })
      .eq("chat_id", unassigned.chat_id);
    if (claimError) throw claimError;
    return unassigned.chat_id;
  }

  // 2. Create a new chat (customer as initiator, staff as recipient)
  const { data: created, error: createError } = await (supabase.from("private_chats") as any)
    .insert({
      initiator_id: customerId,
      initiator_role: "customer",
      recipient_id: staffId,
      recipient_role: staffRole,
      is_closed: false,
    })
    .select("chat_id")
    .single();

  if (createError) throw createError;
  return (created as { chat_id: string }).chat_id;
}
