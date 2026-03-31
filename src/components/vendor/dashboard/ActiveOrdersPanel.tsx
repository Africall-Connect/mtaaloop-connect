import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Check, X, Phone, MessageSquare, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  customer_notes: string | null;
  created_at: string;
  customer_id: string;
  full_name: string | null;
  order_items: Array<{
    product_name: string;
    quantity: number;
  }>;
}

interface ActiveOrdersPanelProps {
  vendorId: string;
}

export default function ActiveOrdersPanel({ vendorId }: ActiveOrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (product_name, quantity)
        `)
        .eq('vendor_id', vendorId)
        .in('status', ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchActiveOrders();

    const channel = supabase
      .channel('active-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` }, () => {
        fetchActiveOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorId, fetchActiveOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updates: Record<string, string | Date> = { status: newStatus };
      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
      if (error) throw error;
      toast.success(`Order ${newStatus}`);
      fetchActiveOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const dispatchForDelivery = async (orderId: string) => {
    try {
      // Get the order's estate info
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('estate_id')
        .eq('id', orderId)
        .single();
      if (orderErr) throw orderErr;

      const { error } = await supabase.from('deliveries').insert({
        order_id: orderId,
        estate_id: order?.estate_id || null,
        status: 'pending',
      });
      if (error) throw error;

      // Do NOT update order status here — the sync trigger will handle it
      // when a rider claims the delivery (assigned → out_for_delivery)
      toast.success('Order dispatched! Waiting for rider to accept.');
      fetchActiveOrders();
    } catch (error) {
      console.error('Dispatch error:', error);
      toast.error('Failed to dispatch order');
    }
  };

  const getStatusInfo = (status: string) => {
    const configs: Record<string, { icon: string; color: string; label: string }> = {
      pending: { icon: '🆕', color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'NEW ORDER' },
      accepted: { icon: '✅', color: 'bg-green-50 text-green-700 border-green-200', label: 'ACCEPTED' },
      preparing: { icon: '👨‍🍳', color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'PREPARING' },
      ready: { icon: '📦', color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'READY FOR PICKUP' },
      out_for_delivery: { icon: '🚴', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'OUT FOR DELIVERY' }
    };
    return configs[status] || configs.pending;
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="text-center">Loading orders...</div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            ACTIVE ORDERS ({orders.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No active orders right now</div>
        ) : (
          orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const customerName = order.full_name || 'Customer';
            const itemsText = order.order_items?.map(item => `${item.product_name} x${item.quantity}`).join(', ') || '';

            return (
              <Card key={order.id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusInfo.color}>{statusInfo.icon} {statusInfo.label}</Badge>
                        <span className="text-sm font-medium">#{order.order_number}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{getTimeAgo(order.created_at)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Customer:</span>
                          <span>{customerName}</span>
                        </div>
                        {order.delivery_address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">{order.delivery_address}</span>
                          </div>
                        )}
                        {itemsText && <div className="text-muted-foreground"><span className="font-medium">Items:</span> {itemsText}</div>}
                        <div className="font-semibold text-base">Total: KES {Number(order.total_amount).toLocaleString()}</div>
                        {order.customer_notes && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs">
                            <span className="font-medium">Special:</span> "{order.customer_notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-2 border-t">
                    {order.status === 'pending' && (
                      <>
                        <Button size="sm" className="gap-1" onClick={() => updateOrderStatus(order.id, 'accepted')}>
                          <Check className="h-4 w-4" />Accept
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                          <X className="h-4 w-4" />Reject
                        </Button>
                      </>
                    )}
                    {order.status === 'accepted' && <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>Start Preparing</Button>}
                    {order.status === 'preparing' && <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}><Check className="h-4 w-4 mr-1" />Mark Ready</Button>}
                    {order.status === 'ready' && <Button size="sm" onClick={() => dispatchForDelivery(order.id)}>🚴 Dispatch for Delivery</Button>}
                    <Button size="sm" variant="outline" className="gap-1"><Eye className="h-4 w-4" />Details</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
