import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Users,
  MessageSquare,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
} from 'lucide-react';

interface CustomerStats {
  id: string;
  orderCount: number;
  totalSpent: number;
  orders: Array<{ created_at: string; [key: string]: unknown }>;
}

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

export default function RiderCustomerManagement() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const fetchCustomers = useCallback(async () => {
    try {
      // Get deliveries completed by this rider
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select('order_id, delivery_fee, created_at')
        .eq('rider_id', user?.id)
        .eq('status', 'delivered');

      // Get order details for these deliveries
      const orderIds = deliveries?.map(d => d.order_id) || [];
      if (orderIds.length === 0) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, customer_id, total_amount, created_at')
        .in('id', orderIds);

      const customerMap = new Map<string, CustomerStats>();

      orders?.forEach(order => {
        const customerId = order.customer_id;
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            orderCount: 0,
            totalSpent: 0,
            orders: []
          });
        }

        const customerData = customerMap.get(customerId)!;
        customerData.orderCount++;
        customerData.totalSpent += Number(order.total_amount);
        customerData.orders.push(order);
      });

      const customerIds = Array.from(customerMap.keys());

      const { data: customerProfiles } = await supabase
        .from('estate_residents')
        .select('*')
        .in('id', customerIds);

      const enrichedCustomers = customerProfiles?.map(profile => {
        const stats = customerMap.get(profile.id);
        if (!stats) return null;
        
        const lastOrder = stats.orders.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          ...profile,
          order_count: stats.orderCount,
          total_spent: stats.totalSpent,
          last_order_date: lastOrder?.created_at || null,
        };
      }).filter(Boolean) as Customer[] || [];

      setCustomers(enrichedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user, fetchCustomers]);

  const filterCustomers = () => {
    if (!searchTerm) return customers;

    return customers.filter(c => {
      const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase()) ||
             c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             c.phone.includes(searchTerm);
    });
  };

  const getTimeAgo = (date: string | null) => {
    if (!date) return 'Never';
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const filteredCustomers = filterCustomers();
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold">{customers.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold">KES {totalRevenue.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map(customer => {
            const customerName = customer.first_name
              ? `${customer.first_name} ${customer.last_name || ''}`.trim()
              : 'Customer';

            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{customerName}</h3>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">Orders</p>
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="h-4 w-4 text-blue-600" />
                            <p className="text-lg font-bold">{customer.order_count}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Spent</p>
                          <p className="text-lg font-bold">KES {customer.total_spent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Member Since</p>
                          <p className="text-sm font-semibold">{new Date(customer.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          Order History
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
