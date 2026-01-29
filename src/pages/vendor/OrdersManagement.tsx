import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  customer_notes: string | null;
  created_at: string;
}

interface OrdersManagementProps {
  vendorId: string;
}

export default function OrdersManagement({ vendorId }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('vendor-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Order ${newStatus}`);
      fetchOrders();
    } catch (error: unknown) {
      toast.error('Failed to update order');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'secondary',
      accepted: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={statusColors[status] as "secondary" | "default" | "destructive"}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const filterOrders = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orders Management</h2>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterOrders('pending').length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({filterOrders('accepted').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({filterOrders('rejected').length})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'accepted', 'rejected'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterOrders(status).map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <div>
                      <span className="font-medium">Amount:</span> KES {order.total_amount}
                    </div>
                    <div>
                      <span className="font-medium">Delivery Address:</span> {order.delivery_address}
                    </div>
                    {order.customer_notes && (
                      <div>
                        <span className="font-medium">Notes:</span> {order.customer_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, 'accepted')}>
                          Accept Order
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                          Reject
                        </Button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <>
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                          Start Preparing
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'rejected')}>
                          Reject Order
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filterOrders(status).length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No {status === 'all' ? '' : status} orders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
