import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Star, Calendar, Download } from 'lucide-react';

interface TopVendor {
  vendor: {
    business_name: string;
    business_type: string;
  };
  orders: number;
  revenue: number;
}

interface RevenueByCategory {
  category: string;
  revenue: number;
  orders: number;
}

interface MonthlyStat {
  month: string;
  orders: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  vendor?: { business_name: string };
  resident?: { apartment_number: string };
  final_amount?: number;
  status: string;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeVendors: number;
  activeResidents: number;
  topVendors: TopVendor[];
  recentOrders: RecentOrder[];
  revenueByCategory: RevenueByCategory[];
  monthlyStats: MonthlyStat[];
}

interface AnalyticsProps {
  estateId?: string;
}

export default function Analytics({ estateId: propEstateId }: AnalyticsProps) {
  // Get estateId from prop or from localStorage
  const estateId = propEstateId || (typeof window !== 'undefined' ? localStorage.getItem('estate_id') : null) || '';
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    activeVendors: 0,
    activeResidents: 0,
    topVendors: [],
    recentOrders: [],
    revenueByCategory: [],
    monthlyStats: []
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          vendor:vendor_profiles!orders_vendor_id_fkey(business_name, business_type)
        `)
        .eq('estate_id', estateId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate metrics
      const totalRevenue = ordersData?.reduce((sum, order) => sum + ((order as any).final_amount || (order as any).total_amount || 0), 0) || 0;
      const totalOrders = ordersData?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get active vendors and residents counts
      const { count: activeVendors } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('estate_id', estateId)
        .eq('is_approved', true);

      const activeResidents = 0; // estate_residents table doesn't exist

      // Get top vendors
      const vendorStats = ordersData?.reduce((acc, order) => {
        const vendorId = (order as any).vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendor: (order as any).vendor || { business_name: 'Unknown', business_type: 'other' },
            orders: 0,
            revenue: 0
          };
        }
        acc[vendorId].orders += 1;
        acc[vendorId].revenue += (order as any).final_amount || (order as any).total_amount || 0;
        return acc;
      }, {} as Record<string, TopVendor>);

      const topVendors = Object.values(vendorStats || {})
        .sort((a: TopVendor, b: TopVendor) => b.revenue - a.revenue)
        .slice(0, 5) as TopVendor[];

      // Get revenue by category
      const categoryStats = ordersData?.reduce((acc, order) => {
        const category = (order as any).vendor?.business_type || 'Other';
        if (!acc[category]) {
          acc[category] = { category, revenue: 0, orders: 0 };
        }
        acc[category].revenue += (order as any).final_amount || (order as any).total_amount || 0;
        acc[category].orders += 1;
        return acc;
      }, {} as Record<string, RevenueByCategory>);

      const revenueByCategory = Object.values(categoryStats || [])
        .sort((a: RevenueByCategory, b: RevenueByCategory) => b.revenue - a.revenue) as RevenueByCategory[];

      // Get monthly stats for the last 6 months
      const monthlyStats: MonthlyStat[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i, 1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthOrders = ordersData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        }) || [];

        const monthRevenue = monthOrders.reduce((sum, order) => sum + ((order as any).final_amount || (order as any).total_amount || 0), 0);

        monthlyStats.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          orders: monthOrders.length,
          revenue: monthRevenue
        });
      }

      // Map recent orders to RecentOrder interface
      const recentOrders: RecentOrder[] = (ordersData?.slice(0, 10) || []).map(order => ({
        id: order.id,
        created_at: order.created_at,
        vendor: order.vendor,
        resident: order.resident,
        final_amount: order.final_amount,
        status: order.status
      }));

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        activeVendors: activeVendors || 0,
        activeResidents: activeResidents || 0,
        topVendors,
        recentOrders,
        revenueByCategory,
        monthlyStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [estateId, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportData = () => {
    const data = {
      summary: {
        totalRevenue: analytics.totalRevenue,
        totalOrders: analytics.totalOrders,
        averageOrderValue: analytics.averageOrderValue,
        activeVendors: analytics.activeVendors,
        activeResidents: analytics.activeResidents
      },
      topVendors: analytics.topVendors,
      revenueByCategory: analytics.revenueByCategory,
      monthlyStats: analytics.monthlyStats,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estate-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Analytics data exported');
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {analytics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {analytics.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {analytics.averageOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeVendors}</div>
            <p className="text-xs text-muted-foreground">
              Approved vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeResidents}</div>
            <p className="text-xs text-muted-foreground">
              Approved residents
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topVendors.length > 0 ? (
              <div className="space-y-4">
                {analytics.topVendors.map((vendor: TopVendor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{vendor.vendor?.business_name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KES {vendor.revenue.toLocaleString()}</p>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No vendor data available</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.revenueByCategory.length > 0 ? (
              <div className="space-y-4">
                {analytics.revenueByCategory.map((category: RevenueByCategory, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-muted-foreground">{category.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KES {category.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No category data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Avg Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.monthlyStats.map((month, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell>{month.orders}</TableCell>
                  <TableCell>KES {month.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    KES {month.orders > 0 ? (month.revenue / month.orders).toLocaleString() : '0'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{order.vendor?.business_name || 'N/A'}</TableCell>
                    <TableCell>{order.resident?.apartment_number || 'N/A'}</TableCell>
                    <TableCell>KES {(order.final_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="default">{order.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No recent orders</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
