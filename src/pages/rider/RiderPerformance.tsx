import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Star, Clock, MapPin, Award, Target, Zap } from 'lucide-react';

interface PerformanceData {
  date: string;
  deliveries: number;
  rating: number;
  onTime: number;
  distance: number;
}

interface RiderPerformanceProps {
  riderId: string;
}

export default function RiderPerformance({ riderId }: RiderPerformanceProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [riderId]);

  const fetchPerformanceData = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: PerformanceData[] = [
        { date: '2024-01-01', deliveries: 8, rating: 4.8, onTime: 7, distance: 45 },
        { date: '2024-01-02', deliveries: 10, rating: 4.9, onTime: 9, distance: 52 },
        { date: '2024-01-03', deliveries: 12, rating: 4.7, onTime: 11, distance: 48 },
        { date: '2024-01-04', deliveries: 9, rating: 4.8, onTime: 8, distance: 41 },
        { date: '2024-01-05', deliveries: 15, rating: 4.9, onTime: 14, distance: 67 },
        { date: '2024-01-06', deliveries: 18, rating: 4.8, onTime: 16, distance: 73 },
        { date: '2024-01-07', deliveries: 16, rating: 4.7, onTime: 15, distance: 69 },
      ];
      setPerformanceData(mockData);
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDeliveries = performanceData.reduce((sum, day) => sum + day.deliveries, 0);
  const totalOnTime = performanceData.reduce((sum, day) => sum + day.onTime, 0);
  const onTimePercentage = totalDeliveries > 0 ? (totalOnTime / totalDeliveries) * 100 : 0;
  const averageRating = performanceData.length > 0
    ? performanceData.reduce((sum, day) => sum + day.rating, 0) / performanceData.length
    : 0;
  const totalDistance = performanceData.reduce((sum, day) => sum + day.distance, 0);

  const radarData = [
    { subject: 'On-Time Delivery', A: onTimePercentage, fullMark: 100 },
    { subject: 'Customer Rating', A: averageRating * 20, fullMark: 100 },
    { subject: 'Delivery Volume', A: Math.min(totalDeliveries / 2, 100), fullMark: 100 },
    { subject: 'Distance Covered', A: Math.min(totalDistance / 10, 100), fullMark: 100 },
    { subject: 'Efficiency', A: 85, fullMark: 100 },
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
      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTimePercentage.toFixed(1)}%</div>
            <Progress value={onTimePercentage} className="mt-2" />
            <p className="text-xs text-gray-600 mt-1">
              {totalOnTime}/{totalDeliveries} deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <span className="text-xl">⭐</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Based on {performanceData.length} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Distance</CardTitle>
            <MapPin className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance} km</div>
            <p className="text-xs text-gray-600 mt-1">
              Avg: {(totalDistance / performanceData.length).toFixed(1)} km/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Performance Score</CardTitle>
            <Award className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">
                +5% this week
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deliveries" fill="#8884d8" name="Deliveries" />
              <Bar dataKey="onTime" fill="#82ca9d" name="On-Time" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Radar & Achievements */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements & Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Speed Demon</span>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Earned
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Completed 50+ deliveries in a week</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">5-Star Rider</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Earned
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Maintained 4.8+ rating for a month</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Reliability Champion</span>
                </div>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  In Progress
                </Badge>
              </div>
              <Progress value={85} className="mt-2" />
              <p className="text-xs text-gray-600">95% on-time delivery rate (current: {onTimePercentage.toFixed(1)}%)</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Distance Master</span>
                </div>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  In Progress
                </Badge>
              </div>
              <Progress value={67} className="mt-2" />
              <p className="text-xs text-gray-600">Cover 1000km this month ({totalDistance}km)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalDeliveries}</div>
              <p className="text-sm text-gray-600">Total Deliveries</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{onTimePercentage.toFixed(1)}%</div>
              <p className="text-sm text-gray-600">On-Time Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{averageRating.toFixed(1)}</div>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
