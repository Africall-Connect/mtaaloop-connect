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

// Friendly messages for every order status the customer can see
const ORDER_STATUS_MESSAGES: Record<string, { title: string; message: string }> = {
  accepted: { title: 'Order Confirmed! 🎉', message: 'Your order has been accepted by the vendor.' },
  preparing: { title: 'Preparing Your Order 👨‍🍳', message: 'The vendor has started preparing your order.' },
  ready: { title: 'Order Ready! 📦', message: 'Your order is ready and waiting for pickup.' },
  out_for_delivery: { title: 'Rider On The Way! 🏍️', message: 'A rider has picked up your order and is heading to you.' },
  in_transit: { title: 'Almost There! 🚴', message: 'Your order is on its way to your location.' },
  picked_up: { title: 'Order Picked Up 📦', message: 'The rider has picked up your order from the vendor.' },
  enroute: { title: 'On The Way! 🏍️', message: 'Your rider is en route to your delivery address.' },
  delivered: { title: 'Delivered! 🎊', message: 'Your order has been delivered. Enjoy!' },
  cancelled: { title: 'Order Cancelled ❌', message: 'Your order has been cancelled.' },
  rejected: { title: 'Order Rejected', message: 'Unfortunately, the vendor could not fulfill your order.' },
};

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

    // Browser notification (works on mobile when tab is in background)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/logo.png',
          tag: id,
          renotify: true,
        } as NotificationOptions);
      } catch {
        // Fallback for browsers that don't support Notification constructor
      }
    }
  }, [playSound]);

  const dismissNotification = useCallback((id: string) => {
    setPopups(prev => prev.filter(n => n.id !== id));
  }, []);

  // ─── CUSTOMER: Subscribe to order status changes ───
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
          const old = payload.old;
          // Only notify if status actually changed
          if (row.status && row.status !== old?.status) {
            const info = ORDER_STATUS_MESSAGES[row.status];
            if (info) {
              pushNotification(info.title, info.message, 'order');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pushNotification]);

  // ─── CUSTOMER: Subscribe to delivery status changes ───
  // This covers rider-side updates (picked_up, in_transit, delivered)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`delivery-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
        },
        async (payload: any) => {
          const row = payload.new;
          const old = payload.old;
          if (!row.order_id || row.status === old?.status) return;

          // Check if this delivery belongs to the customer's order
          const { data: order } = await supabase
            .from('orders')
            .select('customer_id')
            .eq('id', row.order_id)
            .single();

          if (order?.customer_id === user.id) {
            const deliveryMessages: Record<string, { title: string; message: string }> = {
              assigned: { title: 'Rider Assigned! 🏍️', message: 'A rider has been assigned to deliver your order.' },
              heading_to_pickup: { title: 'Rider En Route to Vendor 🏍️', message: 'Your rider is heading to the vendor to pick up your order.' },
              at_vendor: { title: 'Rider at Vendor 📍', message: 'Your rider has arrived at the vendor.' },
              picked: { title: 'Order Picked Up! 📦', message: 'The rider has picked up your order.' },
              picked_up: { title: 'Order Picked Up! 📦', message: 'The rider has picked up your order.' },
              enroute: { title: 'On The Way! 🚴', message: 'Your rider is heading to your location now.' },
              in_transit: { title: 'Almost There! 🚴', message: 'Your order is on its way to you.' },
              delivered: { title: 'Delivered! 🎊', message: 'Your order has been delivered. Enjoy!' },
              cancelled: { title: 'Delivery Cancelled ❌', message: 'The delivery has been cancelled.' },
            };
            const info = deliveryMessages[row.status];
            if (info) {
              pushNotification(info.title, info.message, 'delivery');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pushNotification]);

  // ─── GENERAL: Subscribe to notifications table ───
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

  // ─── VENDOR: Subscribe to order notifications ───
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
          pushNotification('New Order! 🛒', row.message || 'You have a new order!', 'order');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  // ─── VENDOR: Subscribe to order status changes on vendor's orders ───
  useEffect(() => {
    if (!user || !roles.includes('vendor')) return;

    const channel = supabase
      .channel(`vendor-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          const old = payload.old;
          if (row.status && row.status !== old?.status) {
            const vendorMessages: Record<string, string> = {
              cancelled: 'A customer cancelled their order.',
              delivered: 'An order has been delivered!',
            };
            const msg = vendorMessages[row.status];
            if (msg) {
              pushNotification('Order Update', msg, 'order');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  // ─── RIDER: Subscribe to rider notifications ───
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

  // ─── CSR: Subscribe to new unassigned chats ───
  useEffect(() => {
    if (!user || !roles.includes('customer_rep')) return;

    const channel = supabase
      .channel(`csr-new-chats-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_chats',
        },
        (payload: any) => {
          const row = payload.new;
          // Only notify for unassigned chats (no recipient yet)
          if (!row.recipient_id) {
            pushNotification('New customer chat 💬', 'A customer is waiting in the queue', 'system');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  // ─── ADMIN: Subscribe to ticket escalations ───
  useEffect(() => {
    if (!user || !roles.includes('admin')) return;

    const channel = supabase
      .channel(`admin-escalations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload: any) => {
          const row = payload.new;
          const old = payload.old;
          // Only notify when escalated_to_admin transitions to true
          if (row.escalated_to_admin === true && old?.escalated_to_admin !== true) {
            pushNotification(
              '🚨 Ticket escalated to admin',
              row.subject || 'A CSR escalated a support ticket',
              'alert'
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload: any) => {
          const row = payload.new;
          // Tickets created already-escalated (e.g. CSR uses "Escalate" on an order)
          if (row.escalated_to_admin === true || row.status === 'escalated') {
            pushNotification(
              '🚨 New escalation',
              row.subject || 'A new escalated ticket needs review',
              'alert'
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  // ─── CSR: Subscribe to new support tickets ───
  useEffect(() => {
    if (!user || !roles.includes('customer_rep')) return;

    const channel = supabase
      .channel(`csr-new-tickets-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload: any) => {
          const row = payload.new;
          pushNotification(
            `New ticket: ${row.severity === 'urgent' ? '🚨 ' : ''}${row.subject}`,
            row.description?.slice(0, 100) || 'New support ticket filed',
            'alert'
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  // ─── RIDER: Subscribe to new delivery assignments ───
  useEffect(() => {
    if (!user || !roles.includes('rider')) return;

    const channel = supabase
      .channel(`rider-deliveries-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `rider_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          const old = payload.old;
          if (row.status !== old?.status) {
            const riderMessages: Record<string, string> = {
              assigned: 'You have a new delivery assignment!',
              cancelled: 'A delivery has been cancelled.',
            };
            const msg = riderMessages[row.status];
            if (msg) {
              pushNotification('Delivery Update 🏍️', msg, 'delivery');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roles, pushNotification]);

  return (
    <NotificationContext.Provider value={{ pushNotification }}>
      {children}
      <NotificationPopup notifications={popups} onDismiss={dismissNotification} />
    </NotificationContext.Provider>
  );
}
