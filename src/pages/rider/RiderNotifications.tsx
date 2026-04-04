import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, ShoppingBag, Star, AlertTriangle, DollarSign, Megaphone, CheckCheck, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
}

export default function RiderNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('rider_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data as any) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await (supabase as any)
        .from('rider_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await (supabase as any)
        .from('rider_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      delivery: <ShoppingBag className="h-4 w-4" />,
      rating: <Star className="h-4 w-4" />,
      payment: <DollarSign className="h-4 w-4" />,
      system: <Megaphone className="h-4 w-4" />,
      alert: <AlertTriangle className="h-4 w-4" />
    };
    return icons[type] || <Bell className="h-4 w-4" />;
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return 'yesterday';
  };

  const filterByType = (type: string) => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  };

  const groupedNotifications = notifications.reduce((acc, notif) => {
    const date = new Date(notif.created_at);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const key = isToday ? 'TODAY' : 'YESTERDAY';

    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">NOTIFICATIONS</h1>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {notifications.filter(n => !n.is_read).length} unread
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="w-full justify-start bg-white border">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="delivery" className="text-xs">Deliveries</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="rating" className="text-xs">Ratings</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
          </TabsList>

          {['all', 'delivery', 'payment', 'rating', 'system'].map(tabType => (
            <TabsContent key={tabType} value={tabType} className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading notifications...</div>
              ) : filterByType(tabType).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No {tabType === 'all' ? '' : tabType} notifications</p>
                  <p className="text-sm">New notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedNotifications).map(([dateLabel, notifs]) => {
                    const filtered = tabType === 'all' ? notifs : notifs.filter(n => n.type === tabType);
                    if (filtered.length === 0) return null;

                    return (
                      <div key={dateLabel} className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 sticky top-0 bg-gray-50 py-1 px-2 rounded">
                          {dateLabel}
                        </div>
                        {filtered.map(notif => (
                          <div
                            key={notif.id}
                            className={`border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow cursor-pointer ${
                              !notif.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                            }`}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                                    {notif.title}
                                    {!notif.is_read && (
                                      <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {getTimeAgo(notif.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notif.message}
                                </p>
                                {notif.related_id && (
                                  <div className="flex gap-2 mt-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info(notif.message)}>
                                      View Details
                                    </Button>
                                    {notif.type === 'delivery' && (
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => { try { await (supabase as any).from('rider_notifications').update({ is_read: true }).eq('id', notif.id); toast.success("Delivery accepted"); } catch (e) { toast.error("Failed to accept"); } }}>
                                        Accept
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {notifications.filter(n => !n.is_read).length > 0 && (
          <div className="fixed bottom-4 right-4">
            <Button
              onClick={markAllAsRead}
              className="shadow-lg"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
