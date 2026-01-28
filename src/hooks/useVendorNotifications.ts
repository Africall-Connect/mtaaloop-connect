import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface OrderNotification {
  id: string;
  created_at: string;
  order_id: string;
  vendor_id: string;
  message: string;
  read_at: string | null;
}

export const useVendorNotifications = (vendorId: string) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!vendorId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("order_notifications")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => !n.read_at).length || 0);
      }
    };

    fetchNotifications();

    const channel = supabase.channel(`vendor-notifications:${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_notifications', filter: `vendor_id=eq.${vendorId}` },
        () => fetchNotifications()
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorId]);

  return { notifications, unreadCount };
};