import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store, Package, MessageSquare, Bell, Settings,
  Megaphone, BarChart3, Users, ShoppingBag, Wrench, Calendar, Pill, Stethoscope
} from 'lucide-react';
import DashboardMetrics from '@/components/vendor/dashboard/DashboardMetrics';
import ActiveOrdersPanel from '@/components/vendor/dashboard/ActiveOrdersPanel';
import PerformanceChart from '@/components/vendor/dashboard/PerformanceChart';
import TopProducts from '@/components/vendor/dashboard/TopProducts';
import RecentReviews from '@/components/vendor/dashboard/RecentReviews';
import BusinessInsights from '@/components/vendor/dashboard/BusinessInsights';
import NotificationPanel from '@/components/vendor/dashboard/NotificationPanel';

interface VendorProfile {
  id: string;
  business_name: string;
  business_type: string;
  operational_category: 'inventory' | 'service' | 'booking' | 'minimart' | null;
  is_approved: boolean;
  rating: number;
  estate_id: string | null;
}

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

export default function NewVendorDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [estateName, setEstateName] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // fetch profile first, then fetch stats using the vendor_profile.id
  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, business_type, operational_category, is_approved, rating, estate_id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // store vendor_profile_id for other pages if you like
      if (typeof window !== 'undefined' && data?.id) {
        localStorage.setItem('ml_vendor_profile_id', data.id);
      }

      // fetch estate label
      if (data?.estate_id) {
        const { data: estateRow, error: estateErr } = await supabase
          .from('estates')
          .select('name, location')
          .eq('id', data.estate_id)
          .single();

        if (!estateErr && estateRow) {
          const label = estateRow.location
            ? `${estateRow.name} • ${estateRow.location}`
            : estateRow.name;
          setEstateName(label);
        }
      }

      // now fetch stats using vendor_profile id
      if (data?.id) {
        fetchStats(data.id);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [user, fetchProfile]);

  // use vendor_profile_id here, not auth user id
  const fetchStats = async (vendorProfileId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // orders should be keyed by vendor_profile id in your schema
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('vendor_id', vendorProfileId);

      // products are keyed by vendor_profile id — that’s your current schema
      const { data: productsData } = await supabase
        .from('products')
        .select('stock_quantity, low_stock_threshold')
        .eq('vendor_id', vendorProfileId);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating, created_at')
        .eq('vendor_id', vendorProfileId);

      const todayOrders = ordersData?.filter(o =>
        o.created_at.startsWith(today)
      ) || [];

      const completedToday = todayOrders.filter(o => o.status === 'delivered');
      const activeOrders = ordersData?.filter(o =>
        ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
      ) || [];

      const todayRevenue = completedToday.reduce((sum, o) => sum + Number(o.total_amount), 0);

      // some rows may not track inventory, but you didn't add that col to products here,
      // so we just do a simple low stock calc
      const lowStockItems = productsData?.filter(p =>
        p.stock_quantity !== null &&
        p.low_stock_threshold !== null &&
        p.stock_quantity <= p.low_stock_threshold
      ).length || 0;

      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        activeOrders: activeOrders.length,
        completedOrders: completedToday.length,
        newCustomers: 5,
        avgOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
        rating: avgRating,
        totalReviews: reviewsData?.length || 0,
        lowStockItems,
        pendingReviews: 2,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const opCat = profile?.operational_category; // 'inventory' | 'service' | 'booking'

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                  {profile?.business_name ?? 'My Store'}
                  {estateName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      📍 {estateName}
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={isOpen ? 'default' : 'secondary'} className="text-xs">
                    {isOpen ? '🟢 OPEN NOW' : '🔴 CLOSED'}
                  </Badge>
                  {profile?.business_type && (
                    <span className="text-xs text-gray-500">
                      {profile.business_type}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {stats && (stats.lowStockItems + stats.pendingReviews) > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button onClick={signOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>

          {/* quick actions */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/categories')}>
              <Store className="h-4 w-4" />
              Categories
            </Button>

            {/* show only the relevant manager */}
            {opCat === 'inventory' && (
              <Button size="sm" className="gap-2" onClick={() => navigate('/vendor/products')}>
                <Package className="h-4 w-4" />
                Products
              </Button>
            )}
            {opCat === 'minimart' && (
              <Button size="sm" className="gap-2" onClick={() => navigate('/vendor/minimart')}>
                <Store className="h-4 w-4" />
                Minimart
              </Button>
            )}
            {opCat === 'service' && (
              <Button size="sm" className="gap-2" onClick={() => navigate('/vendor/services')}>
                <Wrench className="h-4 w-4" />
                Services
              </Button>
            )}
            {opCat === 'booking' && (
              <Button size="sm" className="gap-2" onClick={() => navigate('/vendor/bookings')}>
                <Calendar className="h-4 w-4" />
                Bookings
              </Button>
            )}
            {opCat === 'pharmacy' && (
              <>
                <Button size="sm" className="gap-2" onClick={() => navigate('/vendor/products')}>
                  <Pill className="h-4 w-4" />
                  Products
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/bookings')}>
                  <Stethoscope className="h-4 w-4" />
                  Consultations
                </Button>
              </>
            )}

            {opCat !== 'minimart' && (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/orders')}>
                <ShoppingBag className="h-4 w-4" />
                Active Orders: {stats?.activeOrders || 0}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/communications')}>
              <MessageSquare className="h-4 w-4" />
              Messages
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/marketing')}>
              <Megaphone className="h-4 w-4" />
              Send Campaign
            </Button>
            {opCat === 'minimart' ? (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/minimart-analytics')}>
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/analytics')}>
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            )}
            {opCat === 'minimart' ? (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/minimart-customers')}>
                <Users className="h-4 w-4" />
                Customers
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/customers')}>
                <Users className="h-4 w-4" />
                Customers
              </Button>
            )}
            {/* <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/vendor/dashboard')}>
              <Store className="h-4 w-4" />
              Dashboard
            </Button> */}
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/vendor/staff')}
            >
              <Users className="h-4 w-4" />
              Staff
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/vendor/payouts')}
            >
              💰 Payouts
            </Button>
            <Button onClick={() => navigate('/support')}>
              Live Support
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {stats && <DashboardMetrics stats={stats} operationalCategory={opCat} />}
        {/* pass vendor_profile.id, not user.id 
        <ActiveOrdersPanel vendorId={profile?.id || ''} />*/}
        <div className="grid gap-6 lg:grid-cols-2">
          <PerformanceChart vendorId={profile?.id || ''} operationalCategory={opCat} />
          <TopProducts vendorId={profile?.id || ''} operationalCategory={opCat} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentReviews vendorId={profile?.id || ''} />
          <BusinessInsights />
        </div>
      </main>

      {showNotifications && (
        <NotificationPanel
          onClose={() => setShowNotifications(false)}
          vendorId={profile?.id || ''}
        />
      )}
    </div>
  );
}
