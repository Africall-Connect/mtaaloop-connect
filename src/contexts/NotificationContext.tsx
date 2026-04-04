import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { NotificationPopup, PopupNotification } from '@/components/NotificationPopup';

interface NotificationContextType {
  pushNotification: (title: string, message: string, type?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  pushNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, roles } = useAuth();
  const { playSound } = useNotificationSound();
  const [popups, setPopups] = useState<PopupNotification[]>([]);
  const permissionAsked = useRef(false);

  // Request browser notification permission once
  useEffect(() => {
    if (permissionAsked.current || !user) return;
    permissionAsked.current = true;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  const pushNotification = useCallback((title: string, message: string, type = 'system') => {
    const id = crypto.randomUUID();
    const notif: PopupNotification = { id, title, message, type, createdAt: new Date() };

    setPopups(prev => [notif, ...prev].slice(0, 5));
    playSound();

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/logo.png',
          tag: id,
        });
      } catch {
        // Fallback: some browsers don't support Notification constructor
      }
    }
  }, [playSound]);

  const dismissNotification = useCallback((id: string) => {
    setPopups(prev => prev.filter(n => n.id !== id));
  }, []);

  // Subscribe to general notifications table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          pushNotification(row.title || 'New Notification', row.message || '', row.type || 'system');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pushNotification]);

  // Subscribe to vendor order notifications
  useEffect(() => {
    if (!user || !roles.includes('vendor')) return;

    const channel = supabase
      .channel(`vendor-order-notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
          filter: `vendor_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          pushNotification('New Order', row.message || 'You have a new order!', 'order');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  // Subscribe to rider notifications
  useEffect(() => {
    if (!user || !roles.includes('rider')) return;

    const channel = supabase
      .channel(`rider-notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rider_notifications',
          filter: `rider_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          pushNotification(row.title || 'Delivery Update', row.message || '', row.type || 'delivery');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  // Subscribe to order status changes (for customers tracking orders)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`order-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          const statusMessages: Record<string, string> = {
            accepted: 'Your order has been accepted!',
            preparing: 'Your order is being prepared',
            ready: 'Your order is ready for pickup',
            out_for_delivery: 'Your order is on its way!',
            delivered: 'Your order has been delivered!',
            cancelled: 'Your order has been cancelled',
          };
          const msg = statusMessages[row.status];
          if (msg) {
            pushNotification('Order Update', msg, 'order');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pushNotification]);

  return (
    <NotificationContext.Provider value={{ pushNotification }}>
      {children}
      <NotificationPopup notifications={popups} onDismiss={dismissNotification} />
    </NotificationContext.Provider>
  );
}
