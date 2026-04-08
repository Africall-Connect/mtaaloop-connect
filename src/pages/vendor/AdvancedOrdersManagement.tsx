import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/exportCSV';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  Download,
  Printer,
  Settings,
  ArrowLeft,
  Eye,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  MessageSquare,
} from 'lucide-react';

interface OrderItem {
  // we don't know exact columns, so keep it loose
  product_name?: string;
  quantity?: number;
  subtotal?: number;
  total?: number;
  price?: number;
}

interface Delivery {
  id: string;
  rider_id: string | null;
  status: string;
  pickup_time: string | null;
  delivery_time: string | null;
  delivery_fee: number;
  rider_profiles: {
    full_name: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string | null;
  status: string;
  total_amount: number;
  delivery_address: string;
  customer_notes: string | null;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
  deliveries?: Delivery[];
  estate_id: string | null;
  customer_id: string | null;
}

export default function AdvancedOrdersManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorError || !vendorProfile) {
        console.error('Vendor profile not found for this user:', vendorError);
        setOrders([]);
        return;
      }

      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          delivery_address,
          customer_notes,
          payment_status,
          created_at,
          estate_id,
          customer_id,
          order_items (*),
          deliveries (
            id,
            rider_id,
            status,
            pickup_time,
            delivery_time,
            delivery_fee,
            rider_profiles (
              full_name
            )
          )
        `)
        .eq('vendor_id', vendorProfile.id)
        .order('created_at', { ascending: false });

      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('created_at', `${today}T00:00:00`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setOrders(
        (data || []).map((order: Record<string, unknown>): Order => ({
          id: order.id as string,
          order_number: order.order_number as string | null,
          status: order.status as string,
          total_amount: order.total_amount as number,
          delivery_address: order.delivery_address as string,
          customer_notes: order.customer_notes as string | null,
          payment_status: order.payment_status as string,
          created_at: order.created_at as string,
          estate_id: order.estate_id as string | null,
          order_items: order.order_items as OrderItem[],
          deliveries: order.deliveries
            ? (order.deliveries as Record<string, unknown>[]).map((delivery: Record<string, unknown>): Delivery => ({
                id: delivery.id as string,
                rider_id: delivery.rider_id as string | null,
                status: delivery.status as string,
                pickup_time: delivery.pickup_time as string | null,
                delivery_time: delivery.delivery_time as string | null,
                delivery_fee: delivery.delivery_fee as number,
                rider_profiles: Array.isArray(delivery.rider_profiles)
                  ? delivery.rider_profiles[0] || null
                  : (delivery.rider_profiles as { full_name: string } | null),
              }))
            : [],
        }))
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter]);

  useEffect(() => {
    if (user) {
      fetchOrders();

      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, dateFilter, fetchOrders]);

  // fetchOrders is now defined above useEffect

  const getStatusCounts = () => {
    return {
      new: orders.filter((o) => o.status === 'pending').length,
      accepted: orders.filter((o) => o.status === 'accepted').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      delivering: orders.filter((o) => o.status === 'out_for_delivery').length,
      completed: orders.filter((o) => o.status === 'delivered').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
    };
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((o) => {
        const orderMatch = o.order_number?.toLowerCase().includes(term);
        const addressMatch = o.delivery_address?.toLowerCase().includes(term);
        return orderMatch || addressMatch;
      });
    }

    return filtered;
  };

  const counts = getStatusCounts();
  const filteredOrders = filterOrders();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/portal')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">ORDERS MANAGEMENT</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Stats */}
        <Card>
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold">REAL-TIME STATISTICS</h2>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as 'all' | 'today' | 'week' | 'month')}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-3xl font-bold text-blue-700">{counts.new}</div>
                  <div className="text-xs sm:text-sm text-blue-600 mt-1">NEW</div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-3xl font-bold text-yellow-700">{counts.accepted}</div>
                  <div className="text-xs sm:text-sm text-yellow-600 mt-1">ACCEPTED</div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-3xl font-bold text-orange-700">{counts.preparing}</div>
                  <div className="text-xs sm:text-sm text-orange-600 mt-1">PREPARING</div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-3xl font-bold text-green-700">{counts.ready}</div>
                  <div className="text-xs sm:text-sm text-green-600 mt-1">READY</div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-3xl font-bold text-purple-700">{counts.delivering}</div>
                  <div className="text-xs sm:text-sm text-purple-600 mt-1">DELIVERING</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-2 sm:p-4 text-center">
                  <div className="text-xl sm:text-3xl font-bold text-gray-700">{counts.completed}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">COMPLETED</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Order ID or Address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => toast.info("Use the search bar and tabs to filter orders")}>
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => { exportToCSV(orders.map(o => ({ id: o.id, status: o.status, total: o.total_amount, created: o.created_at })), 'orders-export'); toast.success("Orders exported"); }}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigate('/vendor/settings')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs + list */}
        <Tabs defaultValue="all" onValueChange={setStatusFilter}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
            <TabsList className="w-max sm:w-full justify-start bg-white border whitespace-nowrap">
              <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                All <Badge variant="secondary" className="text-xs">{orders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                New <Badge variant="secondary" className="text-xs">{counts.new}</Badge>
              </TabsTrigger>
              <TabsTrigger value="accepted" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Accepted <Badge variant="secondary" className="text-xs">{counts.accepted}</Badge>
              </TabsTrigger>
              <TabsTrigger value="preparing" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Preparing <Badge variant="secondary" className="text-xs">{counts.preparing}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ready" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Ready <Badge variant="secondary" className="text-xs">{counts.ready}</Badge>
              </TabsTrigger>
              <TabsTrigger value="out_for_delivery" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Delivering <Badge variant="secondary" className="text-xs">{counts.delivering}</Badge>
              </TabsTrigger>
              <TabsTrigger value="delivered" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Done <Badge variant="secondary" className="text-xs">{counts.completed}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Rejected <Badge variant="secondary" className="text-xs">{counts.rejected}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={statusFilter} className="space-y-4 mt-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">No orders found</CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => {
                return (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              #{order.order_number ?? order.id.slice(0, 8)}
                            </h3>
                            <Badge>{order.status.replace('_', ' ').toUpperCase()}</Badge>
                            <Badge variant="outline" className="bg-green-50">
                              ✓ {order.payment_status?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            KES {Number(order.total_amount).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Customer</p>
                          <p className="font-medium">Customer</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Delivery Address</p>
                          <p className="text-sm">{order.delivery_address}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Items</p>
                        <div className="space-y-1">
                          {order.order_items?.map((item, idx) => {
                            const price =
                              item.subtotal ??
                              item.total ??
                              item.price ??
                              null;

                            return (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>
                                  {item.product_name ?? 'Item'}{' '}
                                  {item.quantity ? `x${item.quantity}` : null}
                                </span>
                                {price !== null ? (
                                  <span className="font-medium">
                                    KES {Number(price).toLocaleString()}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {order.customer_notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                          <p className="text-sm">
                            <span className="font-medium">Special Instructions:</span>{' '}
                            {order.customer_notes}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  // 1. Update order status to accepted
                                  const { error: orderError } = await supabase
                                    .from('orders')
                                    .update({ status: 'accepted' })
                                    .eq('id', order.id);
                                  if (orderError) throw orderError;

                                  // 2. Create delivery row immediately so a rider can claim it
                                  // (idempotent: skip if one already exists for this order)
                                  const { data: existingDel } = await supabase
                                    .from('deliveries')
                                    .select('id')
                                    .eq('order_id', order.id)
                                    .maybeSingle();
                                  if (!existingDel) {
                                    const { error: deliveryError } = await supabase
                                      .from('deliveries')
                                      .insert({
                                        order_id: order.id,
                                        estate_id: order.estate_id,
                                        status: 'pending',
                                        delivery_fee: 50,
                                      });
                                    if (deliveryError) {
                                      console.error('Error creating delivery on accept:', deliveryError);
                                    }
                                  }

                                  fetchOrders();
                                } catch (error) {
                                  console.error('Error accepting order:', error);
                                }
                              }}
                            >
                              Accept Order
                            </Button>
                          )}
                          {(order.status === 'accepted' || order.status === 'preparing') && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  let newStatus = '';
                                  if (order.status === 'accepted') {
                                    newStatus = 'preparing';
                                  } else if (order.status === 'preparing') {
                                    newStatus = 'ready';
                                    // Delivery row is created at Accept step now;
                                    // ensure one exists in case of legacy rows.
                                    const { data: existingDel } = await supabase
                                      .from('deliveries')
                                      .select('id')
                                      .eq('order_id', order.id)
                                      .maybeSingle();
                                    if (!existingDel) {
                                      const { error: deliveryError } = await supabase
                                        .from('deliveries')
                                        .insert({
                                          order_id: order.id,
                                          estate_id: order.estate_id,
                                          status: 'pending',
                                          delivery_fee: 50,
                                        });
                                      if (deliveryError) console.error('Error creating delivery:', deliveryError);
                                    }
                                  }

                                  const { error } = await supabase
                                    .from('orders')
                                    .update({ status: newStatus })
                                    .eq('id', order.id);

                                  if (error) throw error;

                                  // Refresh orders
                                  fetchOrders();
                                } catch (error) {
                                  console.error('Error updating order status:', error);
                                }
                              }}
                            >
                              {order.status === 'accepted' ? 'Prepare Order' : 'Pick Up'}
                            </Button>
                          )}
                          <Sheet open={isDetailsOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                            setIsDetailsOpen(open);
                            if (open) setSelectedOrder(order);
                            else setSelectedOrder(null);
                          }}>
                            <SheetTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-full sm:max-w-lg">
                              <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                  <Package className="h-5 w-5" />
                                  Order Details
                                </SheetTitle>
                                <SheetDescription>
                                  Complete information for order #{selectedOrder?.order_number ?? selectedOrder?.id.slice(0, 8)}
                                </SheetDescription>
                              </SheetHeader>

                              {selectedOrder && (
                                <div className="mt-6 space-y-6">
                                  {/* Order Header */}
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">Order Date</span>
                                      </div>
                                      <span className="text-sm text-gray-600">
                                        {new Date(selectedOrder.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">Payment Status</span>
                                      </div>
                                      <Badge variant="outline" className="bg-green-50">
                                        ✓ {selectedOrder.payment_status?.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">Order Status</span>
                                      </div>
                                      <Badge>{selectedOrder.status.replace('_', ' ').toUpperCase()}</Badge>
                                    </div>
                                  </div>

                                  {/* Customer & Delivery */}
                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Customer Information</h3>
                                      <div className="bg-white border rounded-lg p-3">
                                        <p className="text-sm font-medium">Customer Name</p>
                                        <p className="text-sm text-gray-600">Customer</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Information</h3>
                                      <div className="bg-white border rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-medium">Delivery Address</p>
                                            <p className="text-sm text-gray-600">{selectedOrder.delivery_address}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Order Items */}
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h3>
                                    <div className="space-y-3">
                                      {selectedOrder.order_items?.map((item, idx) => {
                                        const price = item.subtotal ?? item.total ?? item.price ?? null;
                                        return (
                                          <div key={idx} className="flex items-center justify-between bg-white border rounded-lg p-3">
                                            <div className="flex-1">
                                              <p className="text-sm font-medium">{item.product_name ?? 'Item'}</p>
                                              <p className="text-xs text-gray-500">
                                                Quantity: {item.quantity ?? 1}
                                              </p>
                                            </div>
                                            {price !== null && (
                                              <div className="text-right">
                                                <p className="text-sm font-semibold">
                                                  KES {Number(price).toLocaleString()}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Special Instructions */}
                                  {selectedOrder.customer_notes && (
                                    <>
                                      <Separator />
                                      <div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                          <MessageSquare className="h-4 w-4" />
                                          Special Instructions
                                        </h3>
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                          <p className="text-sm text-gray-700">{selectedOrder.customer_notes}</p>
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  <Separator />


                                  {/* Order Total */}
                                  <div className="bg-gray-900 text-white rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-semibold">Total Amount</span>
                                      <span className="text-2xl font-bold">
                                        KES {Number(selectedOrder.total_amount).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              
                            </SheetContent>
                          </Sheet>
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) { toast.error('Not signed in'); return; }
                              const { openModeratedChat } = await import('@/lib/moderatedChat');
                              const chatId = await openModeratedChat(user.id, 'vendor', {
                                contextLabel: `Re: order ${order.order_number || order.id.slice(0, 8)}`,
                              });
                              toast.info('Your message will reach the customer via support.');
                              navigate(`/inbox?chat=${chatId}`);
                            } catch (e: any) {
                              toast.error('Failed: ' + (e?.message || 'Unknown'));
                            }
                          }}>
                            Message Customer (via Support)
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.print()}>
                            Print Receipt
                          </Button>
                        </div>
                        {(order.status === 'pending' || order.status === 'accepted') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('orders')
                                  .update({ status: 'rejected' })
                                  .eq('id', order.id);

                                if (error) throw error;

                                // Refresh orders
                                fetchOrders();
                              } catch (error) {
                                console.error('Error rejecting order:', error);
                              }
                            }}
                          >
                            Reject Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
