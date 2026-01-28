import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  product_name?: string;
  quantity?: number;
  subtotal?: number;
  total?: number;
  price?: number;
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
  vendor_profiles?: {
    business_name?: string;
  } | null;
  isPremium?: boolean;
}

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [regularOrdersData, premiumOrdersData] = await Promise.all([
        supabase
          .from('orders')
          .select(`*, order_items(*), vendor_profiles(business_name)`)
          .eq('customer_id', user.id),
        supabase
          .from('premium_orders')
          .select(`*, premium_order_items(*)`)
          .eq('customer_id', user.id)
      ]);

      if (regularOrdersData.error) throw regularOrdersData.error;
      if (premiumOrdersData.error) throw premiumOrdersData.error;

      const regularOrders = regularOrdersData.data.map(o => ({ ...o, isPremium: false, order_items: o.order_items || [] }));
      const premiumOrders = premiumOrdersData.data.map(o => ({ ...o, isPremium: true, vendor_profiles: { business_name: 'MtaaLoop Mart' }, order_items: o.premium_order_items.map(item => ({...item, product_name: item.product_name})) || [] }));

      const allOrders = [...regularOrders, ...premiumOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: {
      [key: string]: {
        variant: "secondary" | "default" | "outline" | "destructive";
        text: string;
        className?: string;
      };
    } = {
      pending: { variant: "secondary" as const, text: "⏳ Pending" },
      accepted: { variant: "default" as const, text: "✅ Accepted" },
      preparing: { variant: "default" as const, text: "👨‍🍳 Preparing" },
      ready: { variant: "default" as const, text: "✅ Ready" },
      out_for_delivery: { variant: "default" as const, text: "🚴 Out for Delivery" },
      delivered: { variant: "outline" as const, text: "✅ Delivered", className: "bg-success/10 text-success border-success/20" },
      rejected: { variant: "destructive" as const, text: "❌ Rejected" },
      cancelled: { variant: "destructive" as const, text: "❌ Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const filterOrders = (statusFilter: string) => {
    if (statusFilter === 'all') return orders;
    if (statusFilter === 'active') return orders.filter(order => !['delivered', 'rejected', 'cancelled'].includes(order.status));
    if (statusFilter === 'completed') return orders.filter(order => ['delivered', 'rejected', 'cancelled'].includes(order.status));
    return orders;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Orders</h1>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {filterOrders('all').length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                <Link to="/home">
                  <Button>Browse Categories</Button>
                </Link>
              </div>
            ) : (
              filterOrders('all').map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">Order #{order.order_number ?? order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                      {order.isPremium && <Badge className="mt-1">Premium</Badge>}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="font-semibold">{order.vendor_profiles?.business_name ?? 'Vendor'}</p>
                    {order.order_items?.map((item, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {item.product_name ?? 'Item'} {item.quantity ? `x${item.quantity}` : ''}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="font-bold text-lg">KSh {Number(order.total_amount).toLocaleString()}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Order Again</Button>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4 mt-6">
            {filterOrders('active').length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Active Orders</h3>
                <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                <Link to="/home">
                  <Button>Browse Categories</Button>
                </Link>
              </div>
            ) : (
              filterOrders('active').map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">Order #{order.order_number ?? order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                      {order.isPremium && <Badge className="mt-1">Premium</Badge>}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="font-semibold">{order.vendor_profiles?.business_name ?? 'Vendor'}</p>
                    {order.order_items?.map((item, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {item.product_name ?? 'Item'} {item.quantity ? `x${item.quantity}` : ''}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="font-bold text-lg">KSh {Number(order.total_amount).toLocaleString()}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Order Again</Button>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {filterOrders('completed').length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Completed Orders</h3>
                <p className="text-muted-foreground mb-4">Your completed orders will appear here</p>
                <Link to="/home">
                  <Button>Browse Categories</Button>
                </Link>
              </div>
            ) : (
              filterOrders('completed').map((order) => (
                <Card key={order.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">Order #{order.order_number ?? order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                      {order.isPremium && <Badge className="mt-1">Premium</Badge>}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="font-semibold">{order.vendor_profiles?.business_name ?? 'Vendor'}</p>
                    {order.order_items?.map((item, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {item.product_name ?? 'Item'} {item.quantity ? `x${item.quantity}` : ''}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="font-bold text-lg">KSh {Number(order.total_amount).toLocaleString()}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Order Again</Button>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyOrders;
