import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Clock, Package2, Camera, Gift } from 'lucide-react';

export default function BusinessInsights() {
  const insights = [
    {
      icon: <Target className="h-5 w-5 text-blue-600" />,
      title: 'SALES OPPORTUNITY',
      description: 'Saturday is your best day (40% more orders than average). Consider running a "Weekend Special" promotion to maximize this traffic.',
      action: 'Create Weekend Promotion',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      title: 'TIMING OPTIMIZATION',
      description: 'Your peak order time is 7-9 PM (45% of daily orders). Ensure adequate staff during these hours.',
      action: 'View Hourly Analytics',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      icon: <Package2 className="h-5 w-5 text-green-600" />,
      title: 'PRODUCT BUNDLING',
      description: '78% of customers who order Burger Meals also order Fries. Create a combo deal to increase average order value.',
      action: 'Create Combo Deal',
      color: 'bg-green-50 border-green-200'
    },
    {
      icon: <Camera className="h-5 w-5 text-purple-600" />,
      title: 'PHOTO OPPORTUNITY',
      description: 'Products with photos get 3x more orders. You have 5 products without photos.',
      action: 'Add Photos Now',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      icon: <Gift className="h-5 w-5 text-pink-600" />,
      title: 'LOYALTY PROGRAM',
      description: 'You have 23 repeat customers. Start a loyalty program to encourage more repeat business.',
      action: 'Set Up Loyalty Program',
      color: 'bg-pink-50 border-pink-200'
    }
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💡 BUSINESS INSIGHTS & RECOMMENDATIONS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${insight.color} transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{insight.icon}</div>
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">
                  🎯 {insight.title}
                </h4>
                <p className="text-sm text-gray-700">
                  {insight.description}
                </p>
                <Button size="sm" variant="outline" className="h-8">
                  {insight.action}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
