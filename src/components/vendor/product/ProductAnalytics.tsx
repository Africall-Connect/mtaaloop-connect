import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

interface ProductAnalyticsProps {
  vendorId: string;
  onClose: () => void;
}

export default function ProductAnalytics({ vendorId, onClose }: ProductAnalyticsProps) {
  // Placeholder data - replace with actual data fetching and charting logic
  const analyticsData = {
    totalRevenue: 125000,
    bestSeller: 'Milk Bread',
    worstSeller: 'Spinach',
    topCategories: [
      { name: 'Bakery', revenue: 45000 },
      { name: 'Dairy', revenue: 35000 },
      { name: 'Fresh Produce', revenue: 25000 },
    ],
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            Product Analytics
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">KES {analyticsData.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Best Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analyticsData.bestSeller}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Worst Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analyticsData.worstSeller}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Replace with a proper chart component */}
              <div className="space-y-4">
                {analyticsData.topCategories.map(cat => (
                  <div key={cat.name} className="flex justify-between">
                    <span>{cat.name}</span>
                    <span>KES {cat.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
