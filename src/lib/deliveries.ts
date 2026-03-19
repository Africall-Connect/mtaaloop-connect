import { supabase } from '../integrations/supabase/client';

export type DeliveryStatus =
  | "pending"
  | "offered"
  | "assigned"
  | "heading_to_pickup"
  | "at_vendor"
  | "picked"
  | "enroute"
  | "delivered"
  | "canceled";

const ALLOWED_NEXT: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["offered", "assigned"],
  offered: ["assigned"],
  assigned: ["heading_to_pickup", "at_vendor"],
  heading_to_pickup: ["at_vendor", "picked"],
  at_vendor: ["picked"],
  picked: ["enroute"],
  enroute: ["delivered"],
  delivered: [],
  canceled: [],
};

export async function getActiveDelivery() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("delivery_order")
    .select("*")
    .eq("rider_id", userData.user.id)
    .in("status", [
      "assigned",
      "heading_to_pickup",
      "at_vendor",
      "picked",
      "enroute",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  currentStatus: DeliveryStatus,
  nextStatus: DeliveryStatus,
  extra?: Record<string, unknown>
) {
  const allowed = ALLOWED_NEXT[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Transition ${currentStatus} → ${nextStatus} not allowed`);
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("delivery_order")
    .update({
      status: nextStatus,
      ...(nextStatus === "picked" ? { picked_at: now } : {}),
      ...(nextStatus === "delivered" ? { delivered_at: now } : {}),
    })
    .eq("id", deliveryId);

  if (error) throw error;

  await supabase.from("delivery_events").insert([{
    delivery_id: deliveryId,
    rider_id: (await supabase.auth.getUser()).data.user?.id,
    event_type: nextStatus,
    event_payload: extra ?? {},
  }]);

  return true;
}
