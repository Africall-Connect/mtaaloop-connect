import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, ShoppingBag, Star, AlertTriangle, DollarSign, Megaphone, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
}

interface NotificationPanelProps {
  onClose: () => void;
  vendorId: string;
}

export default function NotificationPanel({ onClose, vendorId }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
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
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', vendorId)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      order: <ShoppingBag className="h-4 w-4" />,
      review: <Star className="h-4 w-4" />,
      inventory: <AlertTriangle className="h-4 w-4" />,
      payment: <DollarSign className="h-4 w-4" />,
      system: <Megaphone className="h-4 w-4" />
    };
    return icons[type] || <Megaphone className="h-4 w-4" />;
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
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">🔔 Notifications</h2>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {notifications.filter(n => !n.is_read).length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-white px-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="order" className="text-xs">Orders</TabsTrigger>
            <TabsTrigger value="review" className="text-xs">Reviews</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
            <TabsTrigger value="promotion" className="text-xs">Promotions</TabsTrigger>
          </TabsList>

          {['all', 'order', 'review', 'system', 'promotion'].map(tabType => (
            <TabsContent key={tabType} value={tabType} className="flex-1 overflow-y-auto m-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : filterByType(tabType).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No {tabType === 'all' ? '' : tabType} notifications
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {Object.entries(groupedNotifications).map(([dateLabel, notifs]) => {
                    const filtered = tabType === 'all' ? notifs : notifs.filter(n => n.type === tabType);
                    if (filtered.length === 0) return null;

                    return (
                      <div key={dateLabel} className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 sticky top-0 bg-white py-1">
                          {dateLabel}
                        </div>
                        {filtered.map(notif => (
                          <div
                            key={notif.id}
                            className={`border rounded-lg p-3 space-y-2 hover:shadow-md transition-shadow cursor-pointer ${
                              !notif.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                            }`}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-2">
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
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                      View Details
                                    </Button>
                                    {notif.type === 'order' && (
                                      <Button size="sm" variant="outline" className="h-7 text-xs">
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

        <div className="p-4 border-t bg-white space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={markAllAsRead}
            disabled={notifications.filter(n => !n.is_read).length === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </Button>
        </div>
      </div>
    </div>
  );
}
