import { useVendorNotifications } from "@/hooks/useVendorNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function VendorNotificationsPage() {
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setVendorId(data.id);
      });
  }, [user]);

  const { notifications } = useVendorNotifications(vendorId);

  const markAllRead = async () => {
    if (!vendorId) return;
    const { error } = await supabase
      .from("order_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("vendor_id", vendorId)
      .is("read_at", null);

    if (!error) toast.success("All notifications marked as read");
  };

  if (!vendorId) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Button onClick={markAllRead}>Mark all read</Button>
      </div>

      {notifications.map((note) => (
        <Card key={note.id} className="p-4">
          <div className="font-semibold">{note.message}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(note.created_at).toLocaleString()}
          </div>
        </Card>
      ))}
    </div>
  );
}