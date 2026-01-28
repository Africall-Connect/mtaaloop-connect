import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, Users, BarChart, RefreshCw } from 'lucide-react';
import { getRiderStats, RiderStats, getActiveCustomers, getRiderEarnings, EarningsData } from '@/lib/riderAnalytics';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RiderAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RiderStats | null>(null);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);

  useEffect(() => {
    if (user) {
      fetchInsightsData();
    }
  }, [user, fetchInsightsData]);

  const fetchInsightsData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [riderStats, customers, earnings] = await Promise.all([
        getRiderStats(user.id),
        getActiveCustomers(user.id),
        getRiderEarnings(user.id, 'week'),
      ]);
      setStats(riderStats);
      setActiveCustomers(customers);
      setEarningsData(earnings);
    } catch (error) {
      console.error('Error fetching rider stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const avgDeliveryFee = stats && stats.totalDeliveries > 0
    ? (stats.totalEarnings / stats.totalDeliveries).toFixed(2)
    : '0.00';

  const analyticsData = [
    {
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      title: 'Total Earnings',
      value: `KES ${stats?.totalEarnings.toLocaleString() || '0'}`,
      description: 'All Time',
    },
    {
      icon: <Package className="h-6 w-6 text-blue-500" />,
      title: 'Total Deliveries',
      value: stats?.totalDeliveries.toLocaleString() || '0',
      description: 'All Time',
    },
    {
      icon: <Users className="h-6 w-6 text-purple-500" />,
      title: 'Active Customers',
      value: activeCustomers.toLocaleString(),
      description: 'Last 7 Days',
    },
    {
      icon: <BarChart className="h-6 w-6 text-orange-500" />,
      title: 'Avg Delivery Fee',
      value: `KES ${avgDeliveryFee}`,
      description: 'All time average',
    },
  ];

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const earningsChartData = {
    labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Earnings (KES)',
        data: last7Days.map(date => {
          const dayData = earningsData.find(d => d.date === date);
          return dayData ? dayData.earnings : 0;
        }),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-xs text-gray-500 mt-1">Logged in as Rider ID: {user?.id}</p>
          </div>
          <Button onClick={fetchInsightsData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analyticsData.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                {item.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={earningsChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
