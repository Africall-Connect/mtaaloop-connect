import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EstateAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['estate-analytics', id],
    queryFn: async () => {
      // Fetch from estate_analytics table if data exists
      const { data: analyticsData } = await supabase
        .from('estate_analytics')
        .select('*')
        .eq('estate_id', id!)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch vendor count
      const { count: activeVendors } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('estate_id', id!)
        .eq('is_active', true);

      return {
        orders: {
          total: analyticsData?.total_orders ?? 0,
          revenue: analyticsData?.total_revenue ?? 0,
        },
        activity: {
          activeVendors: activeVendors ?? 0,
          activeResidents: analyticsData?.active_residents ?? 0,
        }
      };
    },
    refetchInterval: 30000
  });

  if (isLoading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Orders Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-semibold">{analytics?.orders.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">KES {analytics?.orders.revenue?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Vendors</span>
                <span className="font-semibold">{analytics?.activity.activeVendors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Residents</span>
                <span className="font-semibold">{analytics?.activity.activeResidents}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstateAnalytics;
