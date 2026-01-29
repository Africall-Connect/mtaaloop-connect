import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Home, Store, Users, LogOut, TrendingUp, DollarSign, Activity, Bell } from 'lucide-react';
import ResidentManagement from './ResidentManagement';
import VendorManagement from './VendorManagement';
import EstateProfile from './EstateProfile';
import Analytics from './Analytics';
import Notifications from './Notifications';
import Settings from './Settings';

interface Estate {
  id: string;
  name: string;
  location: string;
  total_units: number;
  is_approved: boolean;
  active_vendors_count?: number;
  active_residents_count?: number;
}

interface DashboardStats {
  totalUnits: number;
  activeVendors: number;
  activeResidents: number;
  totalOrders: number;
  totalRevenue: number;
  pendingApprovals: number;
}

export default function EstateDashboard() {
  const { signOut, user } = useAuth();
  const [estate, setEstate] = useState<Estate | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUnits: 0,
    activeVendors: 0,
    activeResidents: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (estateId: string) => {
    try {
      // Get active residents count
      const { count: residentsCount } = await supabase
        .from('estate_residents')
        .select('*', { count: 'exact', head: true })
        .eq('estate_id', estateId)
        .eq('is_approved', true);

      // Get pending approvals count
      const { count: pendingCount } = await supabase
        .from('estate_residents')
        .select('*', { count: 'exact', head: true })
        .eq('estate_id', estateId)
        .eq('is_approved', false);

      // Get active vendors count (assuming vendors table exists)
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('estate_id', estateId)
        .eq('is_approved', true);

      // Get orders and revenue (assuming orders table exists)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('estate_id', estateId)
        .eq('status', 'completed');

      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        totalUnits: estate?.total_units || 0,
        activeVendors: vendorsCount || 0,
        activeResidents: residentsCount || 0,
        totalOrders,
        totalRevenue,
        pendingApprovals: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [estate]);

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!estate?.id) return;

    // Subscribe to estate_residents changes
    supabase
      .channel('estate_residents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estate_residents',
          filter: `estate_id=eq.${estate.id}`,
        },
        () => {
          fetchStats(estate.id);
        }
      )
      .subscribe();

    // Subscribe to vendors changes
    supabase
      .channel('vendors_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
          filter: `estate_id=eq.${estate.id}`,
        },
        () => {
          fetchStats(estate.id);
        }
      )
      .subscribe();

    // Subscribe to orders changes
    supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `estate_id=eq.${estate.id}`,
        },
        () => {
          fetchStats(estate.id);
        }
      )
      .subscribe();
  }, [estate, fetchStats]);

  const fetchEstateData = useCallback(async () => {
    try {
      // Fetch estate info
      const { data: estateData, error: estateError } = await supabase
        .from('estates')
        .select('id, name, location, total_units, is_approved, active_vendors_count, active_residents_count')
        .eq('manager_id', user?.id)
        .single();

      if (estateError) throw estateError;
      setEstate(estateData);

      if (estateData?.is_approved) {
        // Fetch real-time stats
        await fetchStats(estateData.id);
      }
    } catch (error) {
      console.error('Error fetching estate data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchStats]);

  useEffect(() => {
    if (user) {
      fetchEstateData();
    }

    return () => {
      // Cleanup subscriptions on unmount
      supabase.removeAllChannels();
    };
  }, [user, fetchEstateData]);

  useEffect(() => {
    if (estate?.id) {
      setupRealtimeSubscriptions();
    }
  }, [estate?.id, setupRealtimeSubscriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {estate?.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant={estate?.is_approved ? 'default' : 'secondary'}
                  className={`px-3 py-1 text-xs font-medium ${
                    estate?.is_approved
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  }`}
                >
                  {estate?.is_approved ? '✓ Approved' : '⏳ Pending Approval'}
                </Badge>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  {estate?.location}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            className="bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 border-white/30 hover:border-white/50 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Units</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
                <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">{stats.totalUnits}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Housing units</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200/50 dark:border-emerald-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Active Vendors</CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/70 transition-colors">
                <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">{stats.activeVendors}</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Service providers</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200/50 dark:border-purple-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Active Residents</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/70 transition-colors">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">{stats.activeResidents}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Community members</p>
            </CardContent>
          </Card>

          <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
            stats.pendingApprovals > 0
              ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200/50 dark:border-orange-800/50'
              : 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200/50 dark:border-slate-800/50'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={`text-sm font-semibold ${
                stats.pendingApprovals > 0
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                Pending Approvals
              </CardTitle>
              <div className={`p-2 rounded-lg transition-colors ${
                stats.pendingApprovals > 0
                  ? 'bg-orange-100 dark:bg-orange-900/50 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/70'
                  : 'bg-slate-100 dark:bg-slate-900/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-900/70'
              }`}>
                <Bell className={`h-5 w-5 ${
                  stats.pendingApprovals > 0
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-1 ${
                stats.pendingApprovals > 0
                  ? 'text-orange-900 dark:text-orange-100'
                  : 'text-slate-900 dark:text-slate-100'
              }`}>
                {stats.pendingApprovals}
              </div>
              <p className={`text-xs ${
                stats.pendingApprovals > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {stats.pendingApprovals > 0 ? 'Requires attention' : 'All clear'}
              </p>
            </CardContent>
          </Card>
        </div>

        {stats.pendingApprovals > 0 && (
          <Card className="border-orange-500/50 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-lg font-semibold">Action Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-800 dark:text-orange-200 leading-relaxed">
                You have <span className="font-bold text-orange-900 dark:text-orange-100">{stats.pendingApprovals}</span> resident approval{stats.pendingApprovals > 1 ? 's' : ''} pending.
                Please review them in the <span className="font-medium underline">Residents</span> tab to keep your community growing.
              </p>
            </CardContent>
          </Card>
        )}

        {!estate?.is_approved && (
          <Card className="border-amber-500/50 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-700 dark:text-amber-300 flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-lg font-semibold">Pending Approval</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                Your estate registration is currently under review. You'll be notified once approved
                and can start managing your estate operations. This usually takes 1-2 business days.
              </p>
            </CardContent>
          </Card>
        )}

        {estate?.is_approved && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="residents">Residents</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/70 transition-colors">
                        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-lg font-semibold">Revenue Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-900 dark:text-green-100 mb-2">
                      KES {stats.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      From <span className="font-semibold">{stats.totalOrders}</span> completed orders
                    </p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200/50 dark:border-indigo-800/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
                        <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-lg font-semibold">Average Order</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                      KES {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toLocaleString() : '0'}
                    </div>
                    <p className="text-indigo-700 dark:text-indigo-300 text-sm">Per transaction</p>
                  </CardContent>
                </Card>
              </div>

              <Notifications estateId={estate?.id || ''} />
            </TabsContent>

            <TabsContent value="residents">
              <ResidentManagement estateId={estate?.id || ''} />
            </TabsContent>

            <TabsContent value="vendors">
              <VendorManagement estateId={estate?.id || ''} />
            </TabsContent>

            <TabsContent value="analytics">
              <Analytics estateId={estate?.id || ''} />
            </TabsContent>

            <TabsContent value="profile">
              <EstateProfile estateId={estate?.id || ''} />
            </TabsContent>

            <TabsContent value="settings">
              <Settings estateId={estate?.id || ''} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
