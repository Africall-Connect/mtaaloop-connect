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

export default function MinimartAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState({
    revenue: { current: 0, previous: 0, growth: 0 },
    orders: { current: 0, previous: 0, growth: 0 },
    customers: { current: 0, previous: 0, growth: 0 },
    avgOrderValue: { current: 0, previous: 0, growth: 0 },
    topProducts: [] as TopProduct[],
    revenueByDay: [] as RevenueByDay[],
    revenueByTimeOfDay: { morning: 0, afternoon: 0, evening: 0 },
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, fetchAnalytics]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const now = new Date();
      const ranges: Record<string, number> = { 'today': 1, 'week': 7, 'month': 30, 'year': 365 };
      const days = ranges[timeRange] || 7;

      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - days);
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - days);

      const { data: vendorProfile } = await supabase.from('vendor_profiles').select('id').eq('user_id', user!.id).single();
      if (!vendorProfile) {
        setLoading(false);
        return;
      }
      const vendorId = vendorProfile.id;

      const { data: currentOrders } = await supabase.from('premium_orders').select('*').eq('vendor_id', vendorId).eq('status', 'delivered').gte('created_at', currentStart.toISOString());
      const { data: previousOrders } = await supabase.from('premium_orders').select('*').eq('vendor_id', vendorId).eq('status', 'delivered').gte('created_at', previousStart.toISOString()).lt('created_at', currentStart.toISOString());

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
      const revenueByDay = Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data }));

      const timeOfDayRevenue = { morning: 0, afternoon: 0, evening: 0 };
      currentOrders?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        const amount = Number(order.total_amount);
        if (hour >= 6 && hour < 12) timeOfDayRevenue.morning += amount;
        else if (hour >= 12 && hour < 18) timeOfDayRevenue.afternoon += amount;
        else if (hour >= 18 || hour < 6) timeOfDayRevenue.evening += amount;
      });

      const { data: topProducts, error: topProductsError } = await supabase.rpc('get_top_premium_products_for_vendor', { vendor_uuid: vendorId, time_range: timeRange });
      if (topProductsError) console.error('Error fetching top products:', topProductsError);

      setAnalytics({
        revenue: { current: currentRevenue, previous: previousRevenue, growth: revenueGrowth },
        orders: { current: currentOrderCount, previous: previousOrderCount, growth: orderGrowth },
        customers: { current: uniqueCustomers, previous: previousUniqueCustomers, growth: customerGrowth },
        avgOrderValue: { current: avgOrder, previous: previousAvgOrder, growth: avgOrderGrowth },
        topProducts: topProducts || [],
        revenueByDay,
        revenueByTimeOfDay: timeOfDayRevenue,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;
  const getGrowthColor = (growth: number) => (growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600');
  const getGrowthIcon = (growth: number) => (growth > 0 ? <TrendingUp className="h-4 w-4" /> : <Activity className="h-4 w-4" />);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => navigate('/vendor/portal')}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-2xl font-bold text-gray-900">MINIMART ANALYTICS</h1></div>
            <div className="flex gap-2"><Select value={timeRange} onValueChange={setTimeRange}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">Last 7 Days</SelectItem><SelectItem value="month">Last 30 Days</SelectItem><SelectItem value="year">Last Year</SelectItem></SelectContent></Select><Button variant="outline"><Download className="h-4 w-4 mr-2" />Export Report</Button></div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between mb-4"><div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div><div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.revenue.growth)}`}>{getGrowthIcon(analytics.revenue.growth)}{Math.abs(analytics.revenue.growth).toFixed(1)}%</div></div><div className="space-y-1"><p className="text-sm text-gray-600">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(analytics.revenue.current)}</p><p className="text-xs text-gray-500">vs {formatCurrency(analytics.revenue.previous)}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between mb-4"><div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-blue-600" /></div><div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.orders.growth)}`}>{getGrowthIcon(analytics.orders.growth)}{Math.abs(analytics.orders.growth).toFixed(1)}%</div></div><div className="space-y-1"><p className="text-sm text-gray-600">Total Orders</p><p className="text-2xl font-bold">{analytics.orders.current}</p><p className="text-xs text-gray-500">vs {analytics.orders.previous}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between mb-4"><div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center"><Users className="h-5 w-5 text-purple-600" /></div><div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.customers.growth)}`}>{getGrowthIcon(analytics.customers.growth)}{Math.abs(analytics.customers.growth).toFixed(1)}%</div></div><div className="space-y-1"><p className="text-sm text-gray-600">Active Customers</p><p className="text-2xl font-bold">{analytics.customers.current}</p><p className="text-xs text-gray-500">vs {analytics.customers.previous}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between mb-4"><div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center"><BarChart3 className="h-5 w-5 text-amber-600" /></div><div className={`flex items-center gap-1 text-sm font-medium ${getGrowthColor(analytics.avgOrderValue.growth)}`}>{getGrowthIcon(analytics.avgOrderValue.growth)}{Math.abs(analytics.avgOrderValue.growth).toFixed(1)}%</div></div><div className="space-y-1"><p className="text-sm text-gray-600">Avg Order Value</p><p className="text-2xl font-bold">{formatCurrency(analytics.avgOrderValue.current)}</p><p className="text-xs text-gray-500">vs {formatCurrency(analytics.avgOrderValue.previous)}</p></div></CardContent></Card>
        </div>
        <Tabs defaultValue="revenue">
          <TabsList className="w-full justify-start bg-white border">
            <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Revenue Over Time</CardTitle></CardHeader>
              <CardContent><div className="h-64 flex items-end justify-between gap-1">{analytics.revenueByDay.map((day, index) => (<div key={index} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-green-500 rounded-t" style={{ height: `${(day.revenue / (Math.max(...analytics.revenueByDay.map(d => d.revenue)) || 1)) * 100}%` }}></div><div className="text-xs text-gray-600">{new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div></div>))}</div></CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Revenue by Time of Day</CardTitle></CardHeader>
                <CardContent className="space-y-3">{analytics.revenue.current > 0 ? Object.entries(analytics.revenueByTimeOfDay).map(([time, revenue]) => (<div key={time}><div className="flex items-center justify-between mb-1"><span className="text-sm capitalize">{time}</span><span className="font-bold">{formatCurrency(revenue)} ({(revenue / analytics.revenue.current * 100).toFixed(0)}%)</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(revenue / analytics.revenue.current * 100)}%` }} /></div></div>)) : <p>No data</p>}</CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="products" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
              <CardContent>{analytics.topProducts.length > 0 ? <div className="space-y-4">{analytics.topProducts.map((product, index) => (<div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"><div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">#{index + 1}</div><div className="flex-1"><p className="font-semibold">{product.name}</p><p className="text-sm text-gray-600">{formatCurrency(product.price)}</p></div><div className="text-right"><p className="font-bold text-lg">{product.total_quantity}</p><p className="text-xs text-gray-600">units sold</p></div></div>))}</div> : <div className="text-center py-12 text-gray-500"><PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" /><p>No product data available yet</p></div>}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
