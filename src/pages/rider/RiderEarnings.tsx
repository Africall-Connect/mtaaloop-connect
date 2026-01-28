import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Target, Download } from 'lucide-react';

interface EarningsData {
  date: string;
  earnings: number;
  deliveries: number;
  tips: number;
}

interface RiderEarningsProps {
  riderId?: string;
}

export default function RiderEarnings({ riderId }: RiderEarningsProps) {
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchEarningsData();
  }, [riderId, selectedPeriod]);

  const fetchEarningsData = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: EarningsData[] = [
        { date: '2024-01-01', earnings: 1200, deliveries: 8, tips: 200 },
        { date: '2024-01-02', earnings: 1500, deliveries: 10, tips: 300 },
        { date: '2024-01-03', earnings: 1800, deliveries: 12, tips: 400 },
        { date: '2024-01-04', earnings: 1400, deliveries: 9, tips: 250 },
        { date: '2024-01-05', earnings: 2000, deliveries: 15, tips: 500 },
        { date: '2024-01-06', earnings: 2500, deliveries: 18, tips: 600 },
        { date: '2024-01-07', earnings: 2200, deliveries: 16, tips: 450 },
      ];
      setEarningsData(mockData);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = earningsData.reduce((sum, day) => sum + day.earnings, 0);
  const totalDeliveries = earningsData.reduce((sum, day) => sum + day.deliveries, 0);
  const averageEarnings = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;
  const totalTips = earningsData.reduce((sum, day) => sum + day.tips, 0);

  const pieData = [
    { name: 'Delivery Fees', value: totalEarnings - totalTips, color: '#8884d8' },
    { name: 'Tips', value: totalTips, color: '#82ca9d' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              This {selectedPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Deliveries</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
            <p className="text-xs text-gray-600 mt-1">
              Avg: KES {Math.round(averageEarnings)} per delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tips Earned</CardTitle>
            <Target className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalTips.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {((totalTips / totalEarnings) * 100).toFixed(1)}% of earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Weekly Goal</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              KES 15,000 target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('week')}
        >
          This Week
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('month')}
        >
          This Month
        </Button>
        <Button
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('year')}
        >
          This Year
        </Button>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Earnings Chart</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daily Earnings</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KES ${value}`, 'Earnings']} />
                  <Bar dataKey="earnings" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `KES ${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average per delivery</span>
                  <span className="font-medium">KES {Math.round(averageEarnings)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Best day</span>
                  <span className="font-medium">KES {Math.max(...earningsData.map(d => d.earnings))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Peak deliveries</span>
                  <span className="font-medium">{Math.max(...earningsData.map(d => d.deliveries))} deliveries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tips percentage</span>
                  <span className="font-medium">{((totalTips / totalEarnings) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KES ${value}`, 'Earnings']} />
                  <Line type="monotone" dataKey="earnings" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
