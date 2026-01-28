import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface PerformanceChartProps {
  vendorId: string;
  operationalCategory: 'inventory' | 'service' | 'booking' | 'minimart' | null;
}

interface DayData {
  day: string;
  orders: number;
  revenue: number;
}

export default function PerformanceChart({ vendorId, operationalCategory }: PerformanceChartProps) {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyData = useCallback(async () => {
    try {
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      const data: DayData[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const fromTable = operationalCategory === 'minimart' ? 'premium_orders' : 'orders';
        const { data: orders } = await supabase
          .from(fromTable)
          .select('total_amount, status')
          .eq('vendor_id', vendorId)
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);

        const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
        const revenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

        data.push({
          day: daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1],
          orders: orders?.length || 0,
          revenue: revenue / 1000
        });
      }

      setWeekData(data);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId, operationalCategory]);

  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  const maxOrders = Math.max(...weekData.map(d => d.orders), 1);
  const maxRevenue = Math.max(...weekData.map(d => d.revenue), 1);

  const getBarHeight = (value: number, max: number) => {
    return `${(value / max) * 100}%`;
  };

  const bestDay = weekData.reduce((best, day) =>
    day.orders > best.orders ? day : best
  , weekData[0] || { day: 'N/A', orders: 0, revenue: 0 });

  const totalOrders = weekData.reduce((sum, d) => sum + d.orders, 0);
  const avgRevenue = weekData.length > 0
    ? weekData.reduce((sum, d) => sum + d.revenue, 0) / weekData.length
    : 0;

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📈 WEEKLY PERFORMANCE
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Export</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Orders & Revenue
        </div>

        <div className="h-48 flex items-end justify-between gap-2 px-2">
          {weekData.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex gap-1" style={{ height: '150px' }}>
                {operationalCategory !== 'minimart' && (
                  <div
                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                    style={{ height: getBarHeight(day.orders, maxOrders), alignSelf: 'flex-end' }}
                    title={`${day.orders} orders`}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-medium bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap transition-opacity">
                      {day.orders} orders
                    </div>
                  </div>
                )}
                <div
                  className="flex-1 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer relative group"
                  style={{ height: getBarHeight(day.revenue, maxRevenue), alignSelf: 'flex-end' }}
                  title={`KES ${(day.revenue * 1000).toLocaleString()}`}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-medium bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap transition-opacity">
                    KES {(day.revenue * 1000).toFixed(0)}
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600">{day.day}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm pt-2 border-t">
          {operationalCategory !== 'minimart' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-600">Orders</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-gray-600">Revenue (KES '000)</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="font-medium text-gray-900">📊 KEY INSIGHTS:</div>
          <ul className="space-y-1 text-gray-600">
            <li>• Best Day: {bestDay.day} ({bestDay.orders} orders, KES {(bestDay.revenue * 1000).toFixed(0)})</li>
            <li>• Total Orders This Week: {totalOrders}</li>
            <li>• Avg Daily Revenue: KES {(avgRevenue * 1000).toFixed(0)}</li>
            <li className="flex items-center gap-1">
              • Week-over-Week Growth: <TrendingUp className="h-3 w-3 text-green-600" /> 12%
            </li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">View Hourly Breakdown</Button>
          <Button variant="outline" size="sm">Compare Periods</Button>
          <Button variant="outline" size="sm">Download CSV</Button>
        </div>
      </CardContent>
    </Card>
  );
}
