import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Phone, MapPin, Calendar, ShoppingBag } from 'lucide-react';

interface CustomerDetailPanelProps {
  customerId: string;
  onClose: () => void;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
}

export default function CustomerDetailPanel({ customerId, onClose }: CustomerDetailPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerName, setCustomerName] = useState('Customer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      // Fetch customer profile
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('full_name, phone')
        .eq('user_id', customerId)
        .maybeSingle();

      if (profile) {
        setCustomerName(profile.full_name || 'Customer');
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      setOrders((ordersData as any) || []);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
    completedOrders: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
        <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl overflow-y-auto p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Customer Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="p-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{customerName}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent className="p-4 text-center">
              <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">KES {stats.totalSpent.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No orders yet</div>
              ) : orders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">#{order.order_number}</div>
                      <div className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">KES {Number(order.total_amount).toLocaleString()}</div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
