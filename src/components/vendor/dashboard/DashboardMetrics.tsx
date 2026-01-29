import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShoppingBag, DollarSign, Users, AlertCircle } from 'lucide-react';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeOrders: number;
  completedOrders: number;
  newCustomers: number;
  avgOrderValue: number;
  rating: number;
  totalReviews: number;
  lowStockItems: number;
  pendingReviews: number;
}

interface DashboardMetricsProps {
  stats: DashboardStats;
  operationalCategory: 'inventory' | 'service' | 'booking' | 'minimart' | 'pharmacy' | null;
}

export default function DashboardMetrics({ stats: initialStats, operationalCategory }: DashboardMetricsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState(initialStats);
  const [vendorRating, setVendorRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('vendor_profiles')
          .select('id, rating, review_count')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching vendor data:', error);
        } else if (data) {
          setVendorRating(data.rating || 0);
          setTotalReviews(data.review_count || 0);

          if (operationalCategory === 'minimart') {
            const { data: premiumOrdersData } = await supabase
              .from('premium_orders')
              .select('status, total_amount, created_at')
              .eq('vendor_id', data.id);

            const todayOrders = premiumOrdersData?.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()) || [];
            const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
            
            setStats(prevStats => ({
              ...prevStats,
              todayOrders: todayOrders.length,
              todayRevenue: todayRevenue,
            }));
          }
        }
      }
    };

    fetchVendorData();
  }, [user, operationalCategory]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Today's Orders
          </CardTitle>
          <ShoppingBag className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.todayOrders}</div>
          <Button variant="link" className="w-full mt-2 text-xs p-0 h-auto" size="sm">
            View All Orders →
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Today's Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            KES {stats.todayRevenue.toLocaleString()}
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-600">
              Avg Order: KES {Math.round(stats.avgOrderValue).toLocaleString()}
            </p>
          </div>
          <Button variant="link" className="w-full mt-2 text-xs p-0 h-auto" size="sm">
            View Breakdown →
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Your Rating
          </CardTitle>
          <Star className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">
              {vendorRating.toFixed(1)}
            </div>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(vendorRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Based on {totalReviews} reviews
          </p>
          <Button variant="link" className="w-full mt-6 text-xs p-0 h-auto" size="sm">
            View All Feedback →
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-amber-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Attention Needed
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.lowStockItems > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  ⚠️
                </Badge>
                <span className="text-sm">{stats.lowStockItems} Low Stock Items</span>
              </div>
            )}
            {stats.pendingReviews > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  ⚠️
                </Badge>
                <span className="text-sm">{stats.pendingReviews} Pending Reviews</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                ℹ️
              </Badge>
              <span className="text-sm">1 Promotion Expiring</span>
            </div>
          </div>
          <Button variant="link" className="w-full mt-3 text-xs p-0 h-auto" size="sm">
            View Details →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
