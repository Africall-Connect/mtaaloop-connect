import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Eye, Check, X, Phone, MessageSquare, MapPin, Navigation, Package, ShoppingCart, Banknote, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { fetchActiveDeliveries, getRiderProfileId, updateDeliveryStatus, type ActiveDelivery } from '../../lib/riderDeliveries';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ErrorResponse } from '@/types/common';

interface ActiveDeliveriesProps {
  riderId?: string; // Optional, will fetch from profile if not provided
}

export function ActiveDeliveries({ riderId }: ActiveDeliveriesProps) {
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [riderProfileId, setRiderProfileId] = useState<string | null>(riderId || null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<ActiveDelivery | null>(null);

  const loadDeliveries = useCallback(async () => {
    try {
      let profileId = riderProfileId;
      if (!profileId) {
        profileId = await getRiderProfileId();
        setRiderProfileId(profileId);
      }

      const data = await fetchActiveDeliveries(profileId);
      setDeliveries(data);
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to load active deliveries:', err);
      toast.error('Failed to load active deliveries');
    } finally {
      setLoading(false);
    }
  }, [riderProfileId]);

  useEffect(() => {
    loadDeliveries();
  }, [riderId, loadDeliveries]);

  const handleStatusUpdate = async (deliveryId: string, nextStatus: string, type: 'normal' | 'premium' | 'trash') => {
    if (updating) return;
    setUpdating(deliveryId);

    try {
      await updateDeliveryStatus(deliveryId, nextStatus, type);
      toast.success(`${type === 'trash' ? 'Trash collection' : 'Delivery'} status updated to ${nextStatus.replace('_', ' ').toUpperCase()}`);
      // Refresh the list
      await loadDeliveries();
    } catch (error: unknown) {
      console.error('Failed to update delivery status:', error);
      toast.error(`Failed to update delivery status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusInfo = (status: string, type?: 'normal' | 'premium' | 'trash') => {
    const configs: Record<string, { icon: string; color: string; label: string }> = {
      assigned: { icon: type === 'trash' ? '🚛' : '📦', color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'ASSIGNED' },
      picked: { icon: '📦', color: 'bg-green-50 text-green-700 border-green-200', label: 'PICKED UP' },
      picked_up: { icon: '🗑️', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'PICKED UP' },
      shopping: { icon: '🛒', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'SHOPPING' },
      purchased: { icon: '🛍️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'PURCHASED' },
      transit: { icon: '🏍️', color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'IN TRANSIT' }
    };
    return configs[status] || configs.assigned;
  };

  const getNextAction = (status: string, type: 'normal' | 'premium' | 'trash') => {
    if (type === 'trash') {
      const actions: Record<string, { label: string; nextStatus: string; icon: string }> = {
        assigned: { label: 'Picked Up Trash', nextStatus: 'picked_up', icon: '🗑️' },
        picked_up: { label: 'Mark as Completed', nextStatus: 'completed', icon: '✅' }
      };
      return actions[status];
    }
    if (type === 'premium') {
      const actions: Record<string, { label: string; nextStatus: string; icon: string }> = {
        assigned: { label: 'Start Shopping', nextStatus: 'shopping', icon: '🛒' },
        shopping: { label: 'Purchased', nextStatus: 'purchased', icon: '🛍️' },
        purchased: { label: 'In Transit', nextStatus: 'transit', icon: '🏍️' },
        transit: { label: 'Mark as Delivered', nextStatus: 'delivered', icon: '✅' }
      };
      return actions[status];
    }
    const actions: Record<string, { label: string; nextStatus: string; icon: string }> = {
      assigned: { label: 'Picked Up', nextStatus: 'picked', icon: '📦' },
      picked: { label: 'Mark as Delivered', nextStatus: 'delivered', icon: '✅' }
    };
    return actions[status];
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
          <div className="text-center">Loading active deliveries...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Deliveries ({deliveries.length})</h2>
        <Button variant="outline" onClick={loadDeliveries}>
          <Navigation className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {deliveries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No active deliveries</p>
            <p className="text-sm">Accept a delivery from the available list to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deliveries.map((delivery) => {
            const { order, type } = delivery;
            const statusInfo = getStatusInfo(delivery.status, type);
            const nextAction = getNextAction(delivery.status, type);
            const customerName =
              order.full_name ||
              (order.customer?.first_name && order.customer?.last_name
                ? `${order.customer.first_name} ${order.customer.last_name}`
                : order.customer?.first_name ||
                  order.customer?.last_name ||
                  order.customer?.email) ||
              'Customer';
            const itemsText = order.order_items?.map(item =>
              `${item.product_name} x${item.quantity}`
            ).join(', ') || '';

            return (
              <Card key={delivery.id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                        {type === 'premium' && <Badge variant="destructive">Premium</Badge>}
                        {type === 'trash' && <Badge className="bg-emerald-100 text-emerald-700">Trash Collection</Badge>}
                        {order.order_number && <span className="text-sm font-medium">#{order.order_number}</span>}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(delivery.created_at)}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Customer:</span>
                            <span>{customerName}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Phone className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="text-gray-900 font-medium">
                                {type === 'trash' ? 'Pickup Location' : 'Delivery Address'}
                              </div>
                              <div className="text-gray-600 text-sm">
                                {type === 'trash' ? `House ${order.house}` : order.delivery_address}
                              </div>
                            </div>
                          </div>

                          {type !== 'trash' && order.vendor && (
                            <div className="text-gray-600">
                              <span className="font-medium">Vendor:</span> {order.vendor.business_name}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {type === 'trash' ? (
                            <div className="text-gray-600">
                              <span className="font-medium">Service Fee:</span> KSh {order.amount ?? 30}
                            </div>
                          ) : (
                            <>
                              <div className="text-gray-600">
                                <span className="font-medium">Items:</span> {itemsText}
                              </div>

                              <div className="font-semibold text-base">
                                Order Total: KES {Number(order.total_amount || order.amount).toLocaleString()}
                              </div>
                            </>
                          )}

                          {order.customer_notes && (
                            <div className="text-gray-600">
                              <span className="font-medium">Notes:</span> {order.customer_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-4 border-t">
                    {nextAction && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(delivery.id, nextAction.nextStatus, type)}
                        disabled={updating === delivery.id}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {updating === delivery.id ? (
                          <>
                            <Package className="h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            {nextAction.icon} {nextAction.label}
                          </>
                        )}
                      </Button>
                    )}

                    <Button size="sm" variant="outline" className="gap-1">
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </Button>

                    <Button size="sm" variant="outline" className="gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Message Customer
                    </Button>

                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelectedDelivery(delivery)}>
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

      <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Review the items for this delivery.
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="py-4">
              <div className="space-y-2 mb-4">
                <p><strong>Customer:</strong> {selectedDelivery.order.full_name}</p>
                <p><strong>Address:</strong> {selectedDelivery.order.delivery_address}</p>
                {selectedDelivery.order.customer_notes && <p><strong>Notes:</strong> {selectedDelivery.order.customer_notes}</p>}
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Items to Deliver</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedDelivery.order.order_items.map((item, index) => (
                    <li key={index}>{item.product_name} x <strong>{item.quantity}</strong></li>
                  ))}
                </ul>
              </div>
              <div className="border-t pt-4 mt-4 text-right">
                <p className="font-bold text-lg">Total: KES {Number(selectedDelivery.order.total_amount).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
