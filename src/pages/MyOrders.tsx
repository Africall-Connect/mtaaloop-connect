import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, ChefHat, CheckCircle2, Truck, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

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
  vendor_id?: string;
}

const MyOrders = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'accepted':
      case 'ready':
      case 'delivered':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'preparing':
        return <ChefHat className="h-3 w-3" />;
      case 'out_for_delivery':
        return <Truck className="h-3 w-3" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
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
      pending: { variant: "secondary" as const, text: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
      accepted: { variant: "default" as const, text: "Accepted" },
      preparing: { variant: "default" as const, text: "Preparing", className: "bg-primary/10 text-primary border-primary/20" },
      ready: { variant: "default" as const, text: "Ready", className: "bg-success/10 text-success border-success/20" },
      out_for_delivery: { variant: "default" as const, text: "Out for Delivery", className: "bg-primary/10 text-primary border-primary/20" },
      delivered: { variant: "outline" as const, text: "Delivered", className: "bg-success/10 text-success border-success/20" },
      rejected: { variant: "destructive" as const, text: "Rejected" },
      cancelled: { variant: "destructive" as const, text: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
        {getStatusIcon(status)}
        {config.text}
      </Badge>
    );
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-l-4 border-l-warning';
      case 'accepted':
      case 'preparing':
      case 'out_for_delivery':
        return 'border-l-4 border-l-primary';
      case 'ready':
      case 'delivered':
        return 'border-l-4 border-l-success';
      case 'rejected':
      case 'cancelled':
        return 'border-l-4 border-l-destructive';
      default:
        return 'border-l-4 border-l-muted';
    }
  };

  const filterOrders = (statusFilter: string) => {
    if (statusFilter === 'all') return orders;
    if (statusFilter === 'active') return orders.filter(order => !['delivered', 'rejected', 'cancelled'].includes(order.status));
    if (statusFilter === 'completed') return orders.filter(order => ['delivered', 'rejected', 'cancelled'].includes(order.status));
    return orders;
  };

  const handleOrderAgain = (order: Order) => {
    let addedCount = 0;
    for (const item of order.order_items || []) {
      const price = item.price ?? (item.subtotal && item.quantity ? item.subtotal / item.quantity : 0);
      if (!price || !item.product_name) continue;
      addItem({
        id: crypto.randomUUID(),
        name: item.product_name,
        price,
        quantity: item.quantity || 1,
        vendorId: order.vendor_id ?? order.id,
        vendorName: order.vendor_profiles?.business_name ?? "Vendor",
      });
      addedCount++;
    }
    if (addedCount > 0) {
      toast.success(`${addedCount} item(s) added to cart`);
      navigate("/cart");
    } else {
      toast.error("Could not re-order — item details unavailable");
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className={`p-4 sm:p-6 hover:shadow-lg transition-all duration-300 ${getStatusBorderColor(order.status)}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg mb-1">Order #{order.order_number ?? order.id.slice(0, 8)}</h3>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
          {order.isPremium && (
            <Badge className="mt-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0">
              Premium
            </Badge>
          )}
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="space-y-2 mb-4">
        <p className="font-semibold">{order.vendor_profiles?.business_name ?? 'Vendor'}</p>
        {order.order_items?.slice(0, 3).map((item, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            • {item.product_name ?? 'Item'} {item.quantity ? `x${item.quantity}` : ''}
          </p>
        ))}
        {order.order_items?.length > 3 && (
          <p className="text-sm text-muted-foreground">
            + {order.order_items.length - 3} more items
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="font-bold text-lg text-primary">KSh {Number(order.total_amount).toLocaleString()}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOrderAgain(order)}>
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Order Again</span>
          </Button>
          <Link to={`/orders/${order.id}`}>
            <Button variant="ghost" size="sm">Details</Button>
          </Link>
        </div>
      </div>
    </Card>
  );

  const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="text-center py-12">
      <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
        <Package className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{subtitle}</p>
      <Link to="/home">
        <Button className="gap-2">
          Browse Categories
        </Button>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        {/* Header with icon wrapper */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Orders</h1>
              {orders.length > 0 && (
                <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
            >
              Active
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
            >
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {filterOrders('all').length === 0 ? (
              <EmptyState title="No Orders Yet" subtitle="Start shopping to see your orders here" />
            ) : (
              filterOrders('all').map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4 mt-6">
            {filterOrders('active').length === 0 ? (
              <EmptyState title="No Active Orders" subtitle="Start shopping to see your orders here" />
            ) : (
              filterOrders('active').map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {filterOrders('completed').length === 0 ? (
              <EmptyState title="No Completed Orders" subtitle="Your completed orders will appear here" />
            ) : (
              filterOrders('completed').map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyOrders;
