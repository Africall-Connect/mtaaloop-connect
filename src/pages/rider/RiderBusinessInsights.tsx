import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Clock, TrendingUp, Star } from 'lucide-react';

interface InsightsData {
  peakHours: string;
  avgDeliveryTime: number;
  weekendBonus: number;
  rating: number;
  weeklyDeliveries: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  monthlyTarget: number;
  weeklyTarget: number;
  ratingTarget: number;
}

export default function RiderBusinessInsights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState<InsightsData>({
    peakHours: '12-2 PM, 6-8 PM',
    avgDeliveryTime: 22,
    weekendBonus: 35,
    rating: 4.7,
    weeklyDeliveries: 24,
    weeklyEarnings: 4200,
    monthlyEarnings: 16800,
    monthlyTarget: 20000,
    weeklyTarget: 30,
    ratingTarget: 5.0
  });

  useEffect(() => {
    if (user) {
      fetchInsightsData();
    }
  }, [user]);

  const fetchInsightsData = async () => {
    // Use hardcoded dummy data as requested
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const insights = [
    {
      icon: <Target className="h-5 w-5 text-blue-600" />,
      title: 'Peak Hours',
      description: `Most deliveries happen around ${insightsData.peakHours}. Focus on these times to maximize earnings.`,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      icon: <Clock className="h-5 w-5 text-green-600" />,
      title: 'Fast Deliveries',
      description: `Your average delivery time is ${insightsData.avgDeliveryTime} minutes. Deliveries under 25 minutes typically get better ratings.`,
      color: 'bg-green-50 border-green-200'
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      title: 'Weekend Bonus',
      description: `Weekend deliveries earn ${insightsData.weekendBonus}% more than weekdays. Consider working weekends to boost your income.`,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      icon: <Star className="h-5 w-5 text-amber-600" />,
      title: 'Customer Satisfaction',
      description: `Maintain your ${insightsData.rating} rating by staying responsive and delivering on time. Good ratings lead to more orders.`,
      color: 'bg-amber-50 border-amber-200'
    }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Business Insights</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Insights Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight, index) => (
            <Card key={index} className={`${insight.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {insight.icon}
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {insight.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
