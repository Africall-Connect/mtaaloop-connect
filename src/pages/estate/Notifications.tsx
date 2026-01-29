import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Bell, CheckCircle, AlertCircle, ShoppingCart, UserPlus, UserMinus, DollarSign, Clock } from 'lucide-react';

interface NotificationMetadata {
  residentId?: string;
  vendorId?: string;
  orderId?: string;
  amount?: number;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: 'order' | 'resident_request' | 'vendor_request' | 'payment' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: NotificationMetadata;
}

interface NotificationsProps {
  estateId: string;
}

export default function Notifications({ estateId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      // For now, we'll simulate notifications based on recent activity
      // In a real app, you'd have a notifications table
      const notificationsList: Notification[] = [];

      // Check for pending resident approvals
      const { data: pendingResidents } = await supabase
        .from('estate_residents')
        .select('*')
        .eq('estate_id', estateId)
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      pendingResidents?.forEach(resident => {
        notificationsList.push({
          id: `resident-${resident.id}`,
          type: 'resident_request',
          title: 'New Resident Request',
          message: `Apartment ${resident.apartment_number} has requested approval`,
          is_read: false,
          created_at: resident.created_at,
          metadata: { residentId: resident.id }
        });
      });

      // Check for pending vendor approvals
      const { data: pendingVendors } = await supabase
        .from('vendors')
        .select('*')
        .eq('estate_id', estateId)
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      pendingVendors?.forEach(vendor => {
        notificationsList.push({
          id: `vendor-${vendor.id}`,
          type: 'vendor_request',
          title: 'New Vendor Application',
          message: `${vendor.business_name} has applied to join your estate`,
          is_read: false,
          created_at: vendor.created_at,
          metadata: { vendorId: vendor.id }
        });
      });

      // Check for recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          vendor:vendors(business_name),
          resident:estate_residents(apartment_number)
        `)
        .eq('estate_id', estateId)
        .order('created_at', { ascending: false })
        .limit(10);

      recentOrders?.forEach(order => {
        notificationsList.push({
          id: `order-${order.id}`,
          type: 'order',
          title: 'New Order Placed',
          message: `Order from ${order.resident?.apartment_number} at ${order.vendor?.business_name}`,
          is_read: false,
          created_at: order.created_at,
          metadata: { orderId: order.id, amount: order.final_amount }
        });
      });

      // Sort by date and limit to 20
      notificationsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(notificationsList.slice(0, 20));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [estateId]);

  const setupRealtimeSubscription = useCallback(() => {
    // Set up realtime subscriptions for live updates
    const residentsSubscription = supabase
      .channel('estate_residents_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'estate_residents',
        filter: `estate_id=eq.${estateId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    const vendorsSubscription = supabase
      .channel('vendors_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vendors',
        filter: `estate_id=eq.${estateId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `estate_id=eq.${estateId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      residentsSubscription.unsubscribe();
      vendorsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, [estateId, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, [estateId, fetchNotifications, setupRealtimeSubscription]);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    );
    toast.success('All notifications marked as read');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'resident_request':
        return <UserPlus className="h-4 w-4" />;
      case 'vendor_request':
        return <UserMinus className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-500';
      case 'resident_request':
        return 'text-green-500';
      case 'vendor_request':
        return 'text-orange-500';
      case 'payment':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="text-center py-8">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {notification.metadata?.amount && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          KES {notification.metadata.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Activity from residents and vendors will appear here
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'resident_request' && !n.is_read).length}
                </p>
                <p className="text-xs text-muted-foreground">Pending Residents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserMinus className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'vendor_request' && !n.is_read).length}
                </p>
                <p className="text-xs text-muted-foreground">Pending Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'order' && !n.is_read).length}
                </p>
                <p className="text-xs text-muted-foreground">New Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Total Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
