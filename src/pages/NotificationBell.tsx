import { Bell } from "lucide-react";
import { useVendorNotifications } from "@/hooks/useVendorNotifications";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Props {
  vendorId: string;
}

export default function NotificationBell({ vendorId }: Props) {
  const navigate = useNavigate();
  const { notifications, unreadCount } = useVendorNotifications(vendorId);
  const [marking, setMarking] = useState(false);

  // 🔔 --- SOUND NOTIFICATION SETUP ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationIdRef = useRef<string | null>(null);
  const firstLoadRef = useRef(true);

  // Initialize audio only on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.wav");
      audioRef.current.volume = 0.7; // not too loud
    }
  }, []);

  // Watch for new notifications and play sound on new unread
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const latest = notifications[0]; // newest first (we ordered by created_at DESC in the hook)
    const previousId = lastNotificationIdRef.current;

    // First time we just set the id and don't play sound
    if (firstLoadRef.current) {
      lastNotificationIdRef.current = latest.id;
      firstLoadRef.current = false;
      return;
    }

    // If there's a new latest notification and it's unread → ding 🔔
    if (latest.id !== previousId && !latest.read_at) {
      lastNotificationIdRef.current = latest.id;
      audioRef.current?.play().catch(() => {}); // Ignore if browser blocks it
    }
  }, [notifications]);

  const markAsRead = async (id: string) => {
    if (marking) return;
    setMarking(true);
    await supabase
      .from("order_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setMarking(false);
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 px-1 text-[10px] bg-red-600 text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-2">
        <div className="font-semibold text-sm px-2 py-1">
          Notifications
        </div>

        <DropdownMenuSeparator />

        {notifications.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-4">
            No notifications yet.
          </div>
        )}

        {notifications.slice(0, 8).map((note) => (
          <DropdownMenuItem
            key={note.id}
            className="flex flex-col items-start cursor-pointer hover:bg-muted/50"
            onClick={() => {
              markAsRead(note.id);
              navigate(`/vendor/orders/${note.order_id}`);
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="font-medium text-sm">{note.message}</div>
              {!note.read_at && (
                <Badge className="ml-2 bg-blue-600 text-white">New</Badge>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {formatTime(note.created_at)}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/vendor/notifications")}
          className="cursor-pointer text-center text-primary"
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}