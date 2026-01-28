import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Phone, MapPin, Calendar, ShoppingBag, Star } from 'lucide-react';

interface CustomerDetailPanelProps {
  customerId: string;
  onClose: () => void;
}

interface CustomerDetail {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string;
  created_at: string;
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
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      setCustomer(customerData);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStats = () => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;

    return { totalOrders, totalSpent, avgOrderValue, completedOrders };
  };

  const stats = getOrderStats();
  const customerName = customer?.first_name
    ? `${customer.first_name} ${customer.last_name || ''}`.trim()
    : 'Customer';

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
        <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Customer Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{customerName}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {customer?.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {customer?.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member since {customer && new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Send Email
                </Button>
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">KES {stats.totalSpent.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">KES {Math.round(stats.avgOrderValue).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Avg Order Value</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.completedOrders}</div>
                <div className="text-sm text-gray-600">Completed Orders</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No orders yet</div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">#{order.order_number}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          KES {Number(order.total_amount).toLocaleString()}
                        </div>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      {order.delivery_address}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                View Full Order History
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Send Promotional Offer
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Add to VIP Segment
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Export Customer Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
