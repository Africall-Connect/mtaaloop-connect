import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { MapPin, Package, Clock, RefreshCw } from 'lucide-react';
import { fetchAvailableDeliveries, acceptDelivery, type AvailableDelivery } from '../../lib/riderDeliveries';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ErrorResponse } from '@/types/common';

interface AvailableDeliveriesProps {
  onDeliveryAccepted?: () => void;
  isOnline?: boolean;
}

export function AvailableDeliveries({ onDeliveryAccepted, isOnline = true }: AvailableDeliveriesProps) {
  const [deliveries, setDeliveries] = useState<AvailableDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = useCallback(async () => {
    try {
      const data = await fetchAvailableDeliveries();
      setDeliveries(data);
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to load available deliveries:', err);
      toast.error('Failed to load available deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      loadDeliveries();
    } else {
      setLoading(false);
    }
  }, [isOnline, loadDeliveries]);

  // Real-time subscription for new deliveries
  useEffect(() => {
    if (!isOnline) return;

    const channel = supabase
      .channel('available-deliveries-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
        loadDeliveries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'premium_deliveries' }, () => {
        loadDeliveries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trash_deliveries' }, () => {
        loadDeliveries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOnline, loadDeliveries]);

  const handleAccept = async (deliveryId: string, type: 'normal' | 'premium' | 'trash') => {
    if (accepting) return;
    setAccepting(deliveryId);

    try {
      await acceptDelivery(deliveryId, type);
      toast.success(type === 'trash' ? 'Trash collection accepted successfully!' : 'Delivery accepted successfully!');
      await loadDeliveries();
      onDeliveryAccepted?.();
    } catch (error) {
      const errMsg = error instanceof Error ? (error as Error).message : (error as any)?.message || (error as any)?.details || 'Failed to accept delivery';
      console.error('Failed to accept delivery:', error);
      toast.error(errMsg);
    } finally {
      setAccepting(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
  };

  if (!isOnline) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Go online to see available deliveries</p>
          <p className="text-sm">Toggle your status to online to start receiving delivery requests.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading available deliveries...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Deliveries ({deliveries.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No deliveries available right now</p>
            <p className="text-sm">Stay online to get notified when new deliveries become available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => {
              const { order, type } = delivery;
              const customer = order?.customer;
              const vendor = order?.vendor;

              const customerName =
                order?.full_name ||
                (customer?.first_name && customer?.last_name
                  ? `${customer.first_name} ${customer.last_name}`
                  : customer?.first_name || customer?.last_name || customer?.email) ||
                'Customer';

              const timeAgo = new Date(delivery.created_at).toLocaleString();

              return (
                <div
                  key={delivery.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={type === 'premium' ? 'destructive' : type === 'trash' ? 'default' : 'outline'} 
                          className={
                            type === 'premium' 
                              ? "bg-red-50 text-red-700 border-red-200" 
                              : type === 'trash'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {type === 'premium' ? 'Premium' : type === 'trash' ? '🗑️ Trash Collection' : `#${order?.order_number ?? 'N/A'}`}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Customer:</span>
                          <span>{customerName}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-gray-900 font-medium">
                              {type === 'trash' ? 'Pickup Location' : 'Delivery Address'}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {type === 'trash' 
                                ? `House ${order?.house ?? 'N/A'}` 
                                : (order?.delivery_address ?? 'Hidden by RLS')
                              }
                            </div>
                          </div>
                        </div>

                        {type === 'trash' ? (
                          <>
                            <div className="text-gray-600">
                              <span className="font-medium">Service Fee:</span> KSh {order?.amount ?? 30}
                            </div>
                            {order?.customer_notes && (
                              <div className="text-gray-600 text-sm">
                                <span className="font-medium">Notes:</span> {order.customer_notes}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-600">
                            <span className="font-medium">
                              {type === 'premium' ? 'Pickup:' : 'Vendor:'}
                            </span>{' '}
                            {type === 'premium' ? 'MtaaLoop Mart' : (vendor?.business_name ?? 'N/A')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t">
                    <Button
                      onClick={() => handleAccept(delivery.id, delivery.type)}
                      disabled={accepting === delivery.id}
                      className="gap-2"
                    >
                      {accepting === delivery.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4" />
                          {type === 'trash' ? 'Accept Pickup' : 'Accept Delivery'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
