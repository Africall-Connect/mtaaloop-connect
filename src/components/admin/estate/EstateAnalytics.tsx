import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  orders: {
    total: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  activity: {
    activeVendors: number;
    activeResidents: number;
    activeRiders: number;
  };
}

const EstateAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['estate-analytics', id],
    queryFn: async () => {
      // Fetch orders stats
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('estate_id', id);
      
      if (ordersError) throw ordersError;

      // Fetch activity stats
      const [
        { count: activeVendors },
        { count: activeResidents },
        { count: activeRiders }
      ] = await Promise.all([
        supabase
          .from('vendor_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('estate_id', id)
          .eq('is_active', true),
        supabase
          .from('residents')
          .select('*', { count: 'exact', head: true })
          .eq('estate_id', id)
          .eq('is_active', true),
        supabase
          .from('rider_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('estate_id', id)
          .eq('is_active', true)
      ]);

      // Calculate revenue stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const totalRevenue = ordersData
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const thisMonthRevenue = ordersData
        .filter(order => 
          order.status === 'completed' && 
          new Date(order.created_at) >= thisMonth
        )
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const lastMonthRevenue = ordersData
        .filter(order => 
          order.status === 'completed' && 
          new Date(order.created_at) >= lastMonth &&
          new Date(order.created_at) < thisMonth
        )
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      return {
        orders: {
          total: ordersData.length,
          completed: ordersData.filter(order => order.status === 'completed').length,
          cancelled: ordersData.filter(order => order.status === 'cancelled').length
        },
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue
        },
        activity: {
          activeVendors: activeVendors || 0,
          activeResidents: activeResidents || 0,
          activeRiders: activeRiders || 0
        }
      } as AnalyticsData;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Orders Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-semibold">{analytics?.orders.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">
                  {analytics?.orders.completed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancelled</span>
                <span className="font-semibold text-red-600">
                  {analytics?.orders.cancelled}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold">
                  KES {analytics?.revenue.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">
                  KES {analytics?.revenue.thisMonth.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Month</span>
                <span className="font-semibold">
                  KES {analytics?.revenue.lastMonth.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Vendors</span>
                <span className="font-semibold">{analytics?.activity.activeVendors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Residents</span>
                <span className="font-semibold">{analytics?.activity.activeResidents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Riders</span>
                <span className="font-semibold">{analytics?.activity.activeRiders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstateAnalytics;