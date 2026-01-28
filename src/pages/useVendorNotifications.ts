import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VendorNotification {
  id: string;
  order_id: string;
  vendor_id: string;
  type: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export function useVendorNotifications(vendorId: string | null) {
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);

  useEffect(() => {
    if (!vendorId) return;

    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from("order_notifications")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchInitial();

    // subscribe to realtime inserts
    const channel = supabase
      .channel(`vendor_notifications_${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_notifications",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as VendorNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [vendorId]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read_at).length,
  };
}