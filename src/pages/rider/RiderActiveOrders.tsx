import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Check, X, Phone, MessageSquare, MapPin, Navigation, Package, Bike } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorResponse, DeliveryUpdate } from '@/types/common';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  customer_notes: string | null;
  created_at: string;
  customer_id: string;
  delivery_fee: number;
  estimated_delivery_time: string;
  customer: {
    first_name: string | null;
    last_name: string | null;
    phone: string;
    email: string;
  };
  order_items: Array<{
    product_name: string;
    quantity: number;
  }>;
  vendor: {
    business_name: string;
    business_phone: string;
  };
}

interface RiderActiveOrdersProps {
  riderId: string;
}

export default function RiderActiveOrders({ riderId }: RiderActiveOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          orders (
            id,
            order_number,
            status,
            total_amount,
            delivery_address,
            customer_notes,
            created_at,
            customer_id,
            estimated_delivery_time,
            customer:app_users (
              first_name,
              last_name,
              phone,
              email
            ),
            order_items (
              product_name,
              quantity
            ),
            vendor:vendor_profiles (
              business_name,
              business_phone
            )
          )
        `)
        .eq('rider_id', riderId)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to load deliveries:", error.message);
        return;
      }

      // Transform the data to match our interface
      const transformedOrders = data?.map((delivery: any) => ({
        ...(delivery.orders || {}),
        delivery_fee: delivery.delivery_fee,
        status: delivery.status
      })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Error fetching orders:', err);
      toast.error(err.message || 'Failed to load active orders');
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    fetchActiveOrders();

    const channel = supabase
      .channel('rider-active-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `rider_id=eq.${riderId}`
        },
        () => {
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId, fetchActiveOrders]);

  const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
    try {
      const statusField = `${newStatus}_at`;
      const updates: DeliveryUpdate & Record<string, string> = { status: newStatus };
      if (['picked_up', 'in_transit', 'delivered'].includes(newStatus)) {
        updates[statusField] = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('order_id', orderId);

      if (error) throw error;

      // Also update order status if delivered
      if (newStatus === 'delivered') {
        await supabase
          .from('orders')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      toast.success(`Order ${newStatus.replace('_', ' ')}`);
      fetchActiveOrders();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Error updating status:', err);
      toast.error(err.message || 'Failed to update order status');
    }
  };

  const getStatusInfo = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      assigned: { icon: <Package className="w-3 h-3" />, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'ASSIGNED' },
      picked_up: { icon: <Bike className="w-3 h-3" />, color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'PICKED UP' },
      in_transit: { icon: <Navigation className="w-3 h-3" />, color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'IN TRANSIT' }
    };
    return configs[status] || configs.assigned;
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
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading active orders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Deliveries ({orders.length})</h2>
        <Button variant="outline" onClick={() => { if (orders.length > 0) { const addr = orders[0].delivery_address; window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`, '_blank'); } }}>
          <Navigation className="h-4 w-4 mr-2" />
          Open in Maps
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No active deliveries</p>
            <p className="text-sm">New orders will appear here when assigned to you</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const customerName =
              order.customer?.first_name ??
              order.customer?.last_name ??
              order.customer?.email ??
              "Customer";
            const itemsText = order.order_items.map(item =>
              `${item.product_name} x${item.quantity}`
            ).join(', ');

            return (
              <Card key={order.id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${statusInfo.color} gap-1`}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                        <span className="text-sm font-medium">#{order.order_number}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(order.created_at)}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Customer:</span>
                            <span>{customerName}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const phone = order.customer?.phone; if (phone) window.location.href = `tel:${phone}`; }}>
                              <Phone className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="text-gray-900 font-medium">Delivery Address</div>
                              <div className="text-gray-600 text-sm">{order.delivery_address}</div>
                            </div>
                          </div>

                          <div className="text-gray-600">
                            <span className="font-medium">Vendor:</span> {order.vendor?.business_name}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-gray-600">
                            <span className="font-medium">Items:</span> {itemsText}
                          </div>

                          <div className="font-semibold text-base">
                            Order Total: KES {Number(order.total_amount).toLocaleString()}
                          </div>

                          <div className="font-semibold text-green-600">
                            Your Fee: KES {Number(order.delivery_fee).toLocaleString()}
                          </div>

                          {order.estimated_delivery_time && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">ETA:</span> {order.estimated_delivery_time}
                            </div>
                          )}
                        </div>
                      </div>

                      {order.customer_notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                          <span className="font-medium">Customer Notes:</span> "{order.customer_notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-4 border-t">
                    {order.status === 'assigned' && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => updateDeliveryStatus(order.id, 'picked_up')}
                        >
                          <Check className="h-4 w-4" />
                          Picked Up from Vendor
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => updateDeliveryStatus(order.id, 'cancelled')}
                        >
                          <X className="h-4 w-4" />
                          Cannot Deliver
                        </Button>
                      </>
                    )}

                    {order.status === 'picked_up' && (
                      <Button
                        size="sm"
                        onClick={() => updateDeliveryStatus(order.id, 'in_transit')}
                      >
                        Start Delivery
                      </Button>
                    )}

                    {order.status === 'in_transit' && (
                      <Button
                        size="sm"
                        onClick={() => updateDeliveryStatus(order.id, 'delivered')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark as Delivered
                      </Button>
                    )}

                    <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`, '_blank')}>
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </Button>

                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { const phone = order.customer?.phone; if (phone) window.location.href = `sms:${phone}`; }}>
                      <MessageSquare className="h-4 w-4" />
                      Message Customer
                    </Button>

                    <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info(`Order #${order.order_number}: ${order.order_items.map(i => `${i.product_name} x${i.quantity}`).join(', ')} - Total: KES ${Number(order.total_amount).toLocaleString()}`)}>
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
