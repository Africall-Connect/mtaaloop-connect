import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, DollarSign, ShoppingBag, Users, Star,
  Download, Calendar, BarChart3, PieChart, Activity, ArrowLeft
} from 'lucide-react';

interface TopProduct {
  name: string;
  revenue: number;
  orders: number;
}

interface RevenueByDay {
  date: string;
  revenue: number;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState({
    revenue: {
      current: 0,
      previous: 0,
      growth: 0
    },
    orders: {
      current: 0,
      previous: 0,
      growth: 0
    },
    customers: {
      current: 0,
      previous: 0,
      growth: 0
    },
    avgOrderValue: {
      current: 0,
      previous: 0,
      growth: 0
    },
    topProducts: [] as TopProduct[],
    revenueByDay: [] as RevenueByDay[],
    ordersByStatus: {} as Record<string, number>,
    customerSegments: {} as Record<string, number>,
    revenueByTimeOfDay: {
      morning: 0,
      afternoon: 0,
      evening: 0
    },
    revenueSources: {
      direct: 0,
      promotions: 0,
      other: 0
    }
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, fetchAnalytics]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const now = new Date();
      const ranges: Record<string, number> = {
        'today': 1,
        'week': 7,
        'month': 30,
        'year': 365
      };
      const days = ranges[timeRange] || 7;

      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - days);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - days);

      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!vendorProfile) {
        console.error("Vendor profile not found for user:", user!.id);
        setLoading(false);
        return;
      }
      const vendorId = vendorProfile.id;

      // Fetch all orders in the current period for status analytics
      const { data: allCurrentOrders } = await supabase
        .from('orders')
        .select('status')
        .eq('vendor_id', vendorId)
        .gte('created_at', currentStart.toISOString());

      // Fetch delivered orders for financial analytics
      const { data: currentOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'delivered')
        .gte('created_at', currentStart.toISOString());

      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'delivered')
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', currentStart.toISOString());

      const currentRevenue = currentOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const previousRevenue = previousOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const currentOrderCount = currentOrders?.length || 0;
      const previousOrderCount = previousOrders?.length || 0;
      const orderGrowth = previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 : 0;

      const uniqueCustomers = new Set(currentOrders?.map(o => o.customer_id)).size;
      const previousUniqueCustomers = new Set(previousOrders?.map(o => o.customer_id)).size;
      const customerGrowth = previousUniqueCustomers > 0 ? ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100 : 0;

      const avgOrder = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
      const previousAvgOrder = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
      const avgOrderGrowth = previousAvgOrder > 0 ? ((avgOrder - previousAvgOrder) / previousAvgOrder) * 100 : 0;

      const dayMap = new Map<string, { orders: number; revenue: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dayMap.set(dateStr, { orders: 0, revenue: 0 });
      }

      currentOrders?.forEach(order => {
        const dateStr = order.created_at.split('T')[0];
        const dayData = dayMap.get(dateStr);
        if (dayData) {
          dayData.orders++;
          dayData.revenue += Number(order.total_amount);
        }
      });

      const revenueByDay = Array.from(dayMap.entries()).map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue
      }));

      const ordersByStatus: Record<string, number> = {};
      allCurrentOrders?.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      // Calculate revenue by time of day
      const timeOfDayRevenue = {
        morning: 0,   // 6AM-12PM
        afternoon: 0, // 12PM-6PM
        evening: 0    // 6PM-12AM
      };

      currentOrders?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        const amount = Number(order.total_amount);
        
        if (hour >= 6 && hour < 12) {
          timeOfDayRevenue.morning += amount;
        } else if (hour >= 12 && hour < 18) {
          timeOfDayRevenue.afternoon += amount;
        } else if (hour >= 18 || hour < 6) {
          timeOfDayRevenue.evening += amount;
        }
      });

      // Calculate revenue sources (for now, all orders are direct as we don't have promo data yet)
      // This can be enhanced when promo code tracking is available
      const revenueSources = {
        direct: currentRevenue,
        promotions: 0,
        other: 0
      };

      // Fetch top products using the new RPC function
      const { data: topProducts, error: topProductsError } = await supabase.rpc(
        'get_top_products_for_vendor',
        {
          vendor_uuid: vendorId,
          time_range: timeRange,
        }
      );

      if (topProductsError) {
        console.error('Error fetching top products:', topProductsError);
      }

      setAnalytics({
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth
        },
        orders: {
          current: currentOrderCount,
          previous: previousOrderCount,
          growth: orderGrowth
        },
        customers: {
          current: uniqueCustomers,
          previous: previousUniqueCustomers,
          growth: customerGrowth
        },
        avgOrderValue: {
          current: avgOrder,
          previous: previousAvgOrder,
          growth: avgOrderGrowth
        },
        topProducts: topProducts || [],
        revenueByDay,
        ordersByStatus,
        customerSegments: {},
        revenueByTimeOfDay: timeOfDayRevenue,
        revenueSources
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/vendor/portal')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">ANALYTICS & REPORTS</h1>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.revenue.growth)}`}>
                  {getGrowthIcon(analytics.revenue.growth)}
                  {Math.abs(analytics.revenue.growth).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.revenue.current)}</p>
                <p className="text-xs text-gray-500">vs {formatCurrency(analytics.revenue.previous)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.orders.growth)}`}>
                  {getGrowthIcon(analytics.orders.growth)}
                  {Math.abs(analytics.orders.growth).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{analytics.orders.current}</p>
                <p className="text-xs text-gray-500">vs {analytics.orders.previous}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.customers.growth)}`}>
                  {getGrowthIcon(analytics.customers.growth)}
                  {Math.abs(analytics.customers.growth).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold">{analytics.customers.current}</p>
                <p className="text-xs text-gray-500">vs {analytics.customers.previous}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.avgOrderValue.growth)}`}>
                  {getGrowthIcon(analytics.avgOrderValue.growth)}
                  {Math.abs(analytics.avgOrderValue.growth).toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.avgOrderValue.current)}</p>
                <p className="text-xs text-gray-500">vs {formatCurrency(analytics.avgOrderValue.previous)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue">
          <TabsList className="w-full justify-start bg-white border">
            <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
            <TabsTrigger value="orders">Order Analytics</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
            <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Revenue Over Time</CardTitle>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Custom Range
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {analytics.revenueByDay.map((day, index) => {
                    const maxRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue), 1);
                    const height = (day.revenue / maxRevenue) * 100;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer relative group"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                          title={`${new Date(day.date).toLocaleDateString()}: ${formatCurrency(day.revenue)}`}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-medium bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap transition-opacity">
                            {formatCurrency(day.revenue)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 rotate-45 origin-top-left">
                          {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.revenue.current > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Direct Orders</span>
                        <span className="font-bold">{formatCurrency(analytics.revenueSources.direct)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(analytics.revenueSources.direct / analytics.revenue.current) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Promotions</span>
                        <span className="font-bold">{formatCurrency(analytics.revenueSources.promotions)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(analytics.revenueSources.promotions / analytics.revenue.current) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Other</span>
                        <span className="font-bold">{formatCurrency(analytics.revenueSources.other)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(analytics.revenueSources.other / analytics.revenue.current) * 100}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No revenue data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Time of Day</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.revenue.current > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Morning (6AM-12PM)</span>
                        <span className="font-bold">{formatCurrency(analytics.revenueByTimeOfDay.morning)} ({((analytics.revenueByTimeOfDay.morning / analytics.revenue.current) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${(analytics.revenueByTimeOfDay.morning / analytics.revenue.current) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Afternoon (12PM-6PM)</span>
                        <span className="font-bold">{formatCurrency(analytics.revenueByTimeOfDay.afternoon)} ({((analytics.revenueByTimeOfDay.afternoon / analytics.revenue.current) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(analytics.revenueByTimeOfDay.afternoon / analytics.revenue.current) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Evening (6PM-12AM)</span>
                        <span className="font-bold">{formatCurrency(analytics.revenueByTimeOfDay.evening)} ({((analytics.revenueByTimeOfDay.evening / analytics.revenue.current) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(analytics.revenueByTimeOfDay.evening / analytics.revenue.current) * 100}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No revenue data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
                  const percentage = (count / analytics.orders.current) * 100;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                        <span className="font-bold">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{product.total_quantity}</p>
                          <p className="text-xs text-gray-600">units sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No product data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Customer insights coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
