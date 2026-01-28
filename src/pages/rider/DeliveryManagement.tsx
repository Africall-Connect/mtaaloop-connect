import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { MapPin, Package } from 'lucide-react';
import { ErrorResponse, DeliveryUpdate, BadgeVariant } from '@/types/common';

interface Delivery {
  id: string;
  order_id: string;
  status: string;
  pickup_time: string | null;
  delivery_time: string | null;
  delivery_fee: number;
  orders: {
    delivery_address: string;
    total_amount: number;
  };
}

interface DeliveryManagementProps {
  riderId: string;
}

export default function DeliveryManagement({ riderId }: DeliveryManagementProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders (
            delivery_address,
            total_amount
          )
        `)
        .eq('rider_id', riderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    fetchDeliveries();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('rider-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `rider_id=eq.${riderId}`
        },
        () => {
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId, fetchDeliveries]);

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'picked_up') {
        updates.pickup_time = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updates.delivery_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', deliveryId);

      if (error) throw error;
      toast.success(`Delivery status updated to ${newStatus.replace('_', ' ')}`);
      fetchDeliveries();
    } catch (error: unknown) {
      toast.error('Failed to update delivery');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      assigned: 'secondary',
      picked_up: 'default',
      in_transit: 'default',
      delivered: 'default',
    };
    return <Badge variant={statusColors[status] as "secondary" | "default"}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const activeDeliveries = deliveries.filter(d => ['assigned', 'picked_up', 'in_transit'].includes(d.status));
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery Management</h1>
        <Button onClick={fetchDeliveries} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Deliveries ({activeDeliveries.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedDeliveries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeDeliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Delivery #{delivery.id.slice(0, 8)}</CardTitle>
                  {getStatusBadge(delivery.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Address:</span> {delivery.orders.delivery_address}
                </div>
                <div>
                  <span className="font-medium">Order Value:</span> KES {delivery.orders.total_amount}
                </div>
                <div>
                  <span className="font-medium">Delivery Fee:</span> KES {delivery.delivery_fee}
                </div>
                <div className="flex gap-2 pt-4">
                  {delivery.status === 'assigned' && (
                    <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}>
                      Mark as Picked Up
                    </Button>
                  )}
                  {delivery.status === 'picked_up' && (
                    <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}>
                      Start Delivery
                    </Button>
                  )}
                  {delivery.status === 'in_transit' && (
                    <Button size="sm" onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}>
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {activeDeliveries.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No active deliveries</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedDeliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Delivery #{delivery.id.slice(0, 8)}</CardTitle>
                  {getStatusBadge(delivery.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Address:</span> {delivery.orders.delivery_address}
                </div>
                <div>
                  <span className="font-medium">Earned:</span> KES {delivery.delivery_fee}
                </div>
                {delivery.delivery_time && (
                  <div>
                    <span className="font-medium">Completed:</span>{' '}
                    {new Date(delivery.delivery_time).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {completedDeliveries.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No completed deliveries yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
