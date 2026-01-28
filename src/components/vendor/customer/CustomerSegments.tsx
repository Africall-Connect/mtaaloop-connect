import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Users, Award, TrendingUp, UserPlus, Mail } from 'lucide-react';

interface Customer {
  segment: string;
  order_count: number;
  total_spent: number;
}

interface CustomerSegmentsProps {
  customers: Customer[];
  onClose: () => void;
}

export default function CustomerSegments({ customers, onClose }: CustomerSegmentsProps) {
  const getSegmentData = (segment: string) => {
    const segmentCustomers = customers.filter(c => c.segment === segment);
    const count = segmentCustomers.length;
    const totalRevenue = segmentCustomers.reduce((sum, c) => sum + c.total_spent, 0);
    const avgSpending = count > 0 ? totalRevenue / count : 0;
    const totalOrders = segmentCustomers.reduce((sum, c) => sum + c.order_count, 0);

    return { count, totalRevenue, avgSpending, totalOrders };
  };

  const vipData = getSegmentData('VIP');
  const regularData = getSegmentData('Regular');
  const returningData = getSegmentData('Returning');
  const newData = getSegmentData('New');

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Customer Segments</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">About Customer Segments</h3>
            <p className="text-sm text-blue-800">
              Customers are automatically segmented based on their purchase behavior. Use these segments
              to target specific groups with personalized campaigns and offers.
            </p>
          </div>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-purple-900">VIP Customers</CardTitle>
                </div>
                <Badge className="bg-purple-600 text-white">
                  {vipData.count} customers
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-purple-800">
                High-value customers with 10+ orders and average order value of KES 2,000+
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-purple-700">Total Revenue</p>
                  <p className="text-xl font-bold text-purple-900">
                    KES {vipData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-700">Avg Spending</p>
                  <p className="text-xl font-bold text-purple-900">
                    KES {Math.round(vipData.avgSpending).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-700">Total Orders</p>
                  <p className="text-xl font-bold text-purple-900">{vipData.totalOrders}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Send Campaign
                </Button>
                <Button size="sm" variant="outline">
                  View Customers
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-blue-900">Regular Customers</CardTitle>
                </div>
                <Badge className="bg-blue-600 text-white">
                  {regularData.count} customers
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-800">
                Loyal customers with 5+ orders
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Total Revenue</p>
                  <p className="text-xl font-bold text-blue-900">
                    KES {regularData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Avg Spending</p>
                  <p className="text-xl font-bold text-blue-900">
                    KES {Math.round(regularData.avgSpending).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Total Orders</p>
                  <p className="text-xl font-bold text-blue-900">{regularData.totalOrders}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Send Campaign
                </Button>
                <Button size="sm" variant="outline">
                  View Customers
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-900">Returning Customers</CardTitle>
                </div>
                <Badge className="bg-green-600 text-white">
                  {returningData.count} customers
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-green-800">
                Customers with 2-4 orders
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-green-700">Total Revenue</p>
                  <p className="text-xl font-bold text-green-900">
                    KES {returningData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Avg Spending</p>
                  <p className="text-xl font-bold text-green-900">
                    KES {Math.round(returningData.avgSpending).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Total Orders</p>
                  <p className="text-xl font-bold text-green-900">{returningData.totalOrders}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Send Campaign
                </Button>
                <Button size="sm" variant="outline">
                  View Customers
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-gray-600" />
                  <CardTitle className="text-gray-900">New Customers</CardTitle>
                </div>
                <Badge className="bg-gray-600 text-white">
                  {newData.count} customers
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-800">
                First-time customers with 1 order
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-700">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">
                    KES {newData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Avg Spending</p>
                  <p className="text-xl font-bold text-gray-900">
                    KES {Math.round(newData.avgSpending).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Total Orders</p>
                  <p className="text-xl font-bold text-gray-900">{newData.totalOrders}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Welcome Campaign
                </Button>
                <Button size="sm" variant="outline">
                  View Customers
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle>Segment Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-2">
                <div className="font-medium min-w-[100px]">VIP:</div>
                <div>Offer exclusive deals, early access to new products, loyalty rewards</div>
              </div>
              <div className="flex gap-2">
                <div className="font-medium min-w-[100px]">Regular:</div>
                <div>Send personalized recommendations, volume discounts, birthday offers</div>
              </div>
              <div className="flex gap-2">
                <div className="font-medium min-w-[100px]">Returning:</div>
                <div>Encourage more frequent orders with incentives and reminders</div>
              </div>
              <div className="flex gap-2">
                <div className="font-medium min-w-[100px]">New:</div>
                <div>Welcome offers, product education, satisfaction follow-ups</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
