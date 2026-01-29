// NOTE: This rider flow uses `deliveries` (orders → deliveries).
// Do NOT use `delivery_order` here. That is a separate workflow.

import { useEffect, useState, useCallback } from 'react';
import { useRiderStore } from '../../store/riderStore';
import { useRiderStatusStore } from '../../store/riderStatusStore';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useActiveDelivery } from '../../hooks/useActiveDelivery';
import { getCurrentRiderStatus, setRiderOnlineStatus } from '../../lib/riderStatus';
import { getMyWallet } from '../../lib/wallet';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import {
  Bike,
  Package,
  Star,
  TrendingUp,
  Wallet,
  Bell,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';
import RiderActiveOrders from './RiderActiveOrders';
import RiderCommunications from './RiderCommunications';
import RiderCustomerManagement from './RiderCustomerManagement';
import RiderAnalytics from './RiderAnalytics';
import RiderBusinessInsights from './RiderBusinessInsights';
import RiderNotifications from './RiderNotifications';
import RiderEarnings from './RiderEarnings';
import RiderWallet from './RiderWallet';
import { AvailableDeliveries } from '../../components/rider/AvailableDeliveries';
import { ActiveDeliveries } from '../../components/rider/ActiveDeliveries';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { getRiderProfileId, fetchActiveDeliveries, type ActiveDelivery } from '../../lib/riderDeliveries';
import { getRiderStats, getRecentDeliveries, type RiderStats } from '../../lib/riderAnalytics';

export default function RiderDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    status,
    currentLocation,
    activeDelivery,
    todaysEarnings,
    todaysDeliveries,
    weeklyEarnings,
    monthlyEarnings,
    isLocationTrackingEnabled,
    setLocationTrackingEnabled,
  } = useRiderStore();

  const { isTracking, startTracking, stopTracking } = useLocationTracking();

  const [activeView, setActiveView] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  const { online, lastOnlineAt, setStatus } = useRiderStatusStore();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Active deliveries state
  const [riderProfileId, setRiderProfileId] = useState<string | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);

  // Today's deliveries state
  interface TodaysDelivery {
    id: string;
    vendor_name?: string;
    pickup_address?: string;
    delivery_address?: string;
    status?: string;
    delivery_fee?: number;
    delivery_time?: string;
    orders?: {
      vendor_profiles?: { business_name?: string };
      delivery_address?: string;
    };
  }
  const [todaysDeliveriesList, setTodaysDeliveriesList] = useState<TodaysDelivery[]>([]);
  const [loadingTodays, setLoadingTodays] = useState(false);

  // Recent deliveries state
  const [recentDeliveries, setRecentDeliveries] = useState<Record<string, unknown>[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Real stats state
  const [riderStats, setRiderStats] = useState<RiderStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Average rating state
  const [averageRating, setAverageRating] = useState<number>(0);

  // Theme state with green dark mode
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('rider-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  // Theme toggle handler with green dark mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('rider-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    // Apply green theme styling
    if (newTheme === 'dark') {
      document.documentElement.style.setProperty('--primary-color', '#10b981');
      document.documentElement.style.setProperty('--accent-color', '#34d399');
      document.documentElement.style.setProperty('--font-family', "'JetBrains Mono', 'Fira Code', monospace");
    } else {
      document.documentElement.style.removeProperty('--primary-color');
      document.documentElement.style.removeProperty('--accent-color');
      document.documentElement.style.removeProperty('--font-family');
    }
  };

  // Apply theme on mount and theme change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--primary-color', '#10b981');
      document.documentElement.style.setProperty('--accent-color', '#34d399');
      document.documentElement.style.setProperty('--font-family', "'JetBrains Mono', 'Fira Code', monospace");
    }
  }, [theme]);

  const { delivery, loading: deliveryLoading, updating, error: deliveryError, advance } = useActiveDelivery();

  // load initial status from Supabase once
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getCurrentRiderStatus();
        if (!active) return;
        setStatus(data.online, data.last_online_at ?? null);
      } catch (err) {
        console.error("Failed to load rider status", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [setStatus]);

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("rider-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rider_status",
        },
        (payload) => {
          // only update if it's me
          const myId = supabase.auth.getUser().then((u) => {
            if (u.data.user?.id === payload.new.rider_id) {
              setStatus(payload.new.online, payload.new.last_online_at);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setStatus]);

  useEffect(() => {
    // Initialize rider status if not set
    if (user && !status) {
      // TODO: Fetch rider profile and status from API
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [user, status]);

  // Load wallet balance
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const wallet = await getMyWallet();
        setWalletBalance(wallet?.balance || 0);
      } catch (err) {
        console.error("Failed to load wallet", err);
        setWalletBalance(0);
      }
    };
    if (user) {
      loadWallet();
    }
  }, [user]);

  // Load rider profile ID and active deliveries
  useEffect(() => {
    const loadRiderProfile = async () => {
      try {
        const profileId = await getRiderProfileId();
        setRiderProfileId(profileId);
      } catch (err) {
        console.error("Failed to load rider profile", err);
      }
    };
    if (user) {
      loadRiderProfile();
    }
  }, [user]);

  const loadActiveDeliveries = useCallback(async () => {
    if (!riderProfileId) return;
    setLoadingActive(true);
    try {
      const data = await fetchActiveDeliveries(riderProfileId);
      setActiveDeliveries(data);
    } catch (error) {
      console.error('Failed to load active deliveries:', error);
    } finally {
      setLoadingActive(false);
    }
  }, [riderProfileId]);

  const loadRecentDeliveries = useCallback(async () => {
    if (!riderProfileId) return;
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id,
          status,
          delivery_fee,
          created_at,
          pickup_time,
          delivery_time,
          orders (
            id,
            total_amount,
            delivery_address,
            vendor_profiles (
              business_name
            )
          )
        `)
        .eq('rider_id', riderProfileId)
        .eq('status', 'delivered')
        .order('delivery_time', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentDeliveries(data || []);
    } catch (error) {
      console.error('Failed to load recent deliveries:', error);
    } finally {
      setLoadingRecent(false);
    }
  }, [riderProfileId]);

  const loadRiderStats = useCallback(async () => {
    if (!riderProfileId) return;
    setLoadingStats(true);
    try {
      const stats = await getRiderStats(riderProfileId);
      setRiderStats(stats);
    } catch (error) {
      console.error('Failed to load rider stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [riderProfileId]);

  // Load active deliveries and stats when riderProfileId is available
  useEffect(() => {
    if (riderProfileId) {
      loadActiveDeliveries();
      loadRecentDeliveries();
      loadRiderStats();
    }
  }, [riderProfileId, loadActiveDeliveries, loadRecentDeliveries, loadRiderStats]);

  // Mock profile data for now
  const profile = {
    id: user?.id || '',
    full_name: user?.user_metadata?.full_name || 'John Doe',
    vehicle_type: 'motorcycle',
    is_approved: true,
    rating: 4.8,
    total_deliveries: 156,
  };

  // SAFETY DEFAULTS: make sure these are numbers
  const safeTodaysEarnings = typeof todaysEarnings === 'number' ? todaysEarnings : 0;
  const safeTodaysDeliveries = typeof todaysDeliveries === 'number' ? todaysDeliveries : 0;
  const safeWeeklyEarnings = typeof weeklyEarnings === 'number' ? weeklyEarnings : 0;
  const safeMonthlyEarnings = typeof monthlyEarnings === 'number' ? monthlyEarnings : 0;

  const stats = {
    todayDeliveries: safeTodaysDeliveries,
    todayEarnings: safeTodaysEarnings,
    activeDeliveries: activeDeliveries.length,
    completedDeliveries: 12,
    weeklyEarnings: safeWeeklyEarnings,
    monthlyEarnings: safeMonthlyEarnings,
    rating: profile.rating,
    totalDeliveries: profile.total_deliveries,
    pendingDeliveries: 3,
    lowBattery: status?.batteryPct !== undefined && status.batteryPct < 20,
  };

  const handleOnlineToggle = async (online: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await setRiderOnlineStatus(online);
      setStatus(data.online, data.last_online_at);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryAccepted = () => {
    // Refresh active deliveries when a delivery is accepted
    // This will be handled by the components themselves via their useEffect hooks
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-emerald-950 dark:to-green-950 font-sans dark:font-mono">
      {/* HEADER */}
      <header className="bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-emerald-900 dark:to-green-900 border-b border-gray-200 dark:border-emerald-700/50 sticky top-0 z-50 backdrop-blur-sm dark:backdrop-blur-md">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left: Profile */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Bike className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {profile.full_name}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 mt-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Label htmlFor="online-toggle" className="text-xs text-gray-700 dark:text-gray-300">
                      {online ? '🟢 ONLINE' : '🔴 OFFLINE'}
                    </Label>
                    <Switch
                      id="online-toggle"
                      checked={online}
                      onCheckedChange={handleOnlineToggle}
                      disabled={loading}
                      className="scale-75 sm:scale-100 data-[state=checked]:bg-green-500"
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() =>
                  setActiveView(
                    activeView === 'notifications' ? null : 'notifications'
                  )
                }
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                {(stats.pendingDeliveries + (stats.lowBattery ? 1 : 0)) > 0 && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500 rounded-full" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => navigate('/inbox')}
                title="Inbox"
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              <Button onClick={signOut} variant="outline" size="sm" className="hidden sm:inline-flex border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-2 sm:mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-auto">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-3">Overview</TabsTrigger>
                <TabsTrigger value="active-orders" className="text-xs sm:text-sm px-1 sm:px-3">Active Orders</TabsTrigger>
                <TabsTrigger value="customers" className="text-xs sm:text-sm px-1 sm:px-3">Customers</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm px-1 sm:px-3">Analytics</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs sm:text-sm px-1 sm:px-3">Insights</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Active Delivery Section */}
        {delivery && (
          <Card className="border-blue-200 dark:border-blue-300 bg-blue-50/50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Active Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</p>
                  <p className="text-sm sm:text-lg truncate text-gray-900 dark:text-gray-100">{delivery.vendor_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Pickup Address</p>
                  <p className="text-sm sm:text-lg truncate text-gray-900 dark:text-gray-100">{delivery.pickup_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Address</p>
                  <p className="text-sm sm:text-lg truncate text-gray-900 dark:text-gray-100">{delivery.delivery_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-300 text-xs">
                    {delivery.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex gap-2 overflow-x-auto">
                {delivery.status === 'assigned' && (
                  <>
                    <Button
                      onClick={() => advance('heading_to_pickup')}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto whitespace-nowrap"
                      size="sm"
                    >
                      🚴 Start to Pickup
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {/* Simulate navigation */}}
                      className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto whitespace-nowrap"
                      size="sm"
                    >
                      🗺️ Navigate to Vendor
                    </Button>
                  </>
                )}
                {delivery.status === 'heading_to_pickup' && (
                  <Button
                    onClick={() => advance('at_vendor')}
                    disabled={updating}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto whitespace-nowrap"
                    size="sm"
                  >
                    ✅ Arrived at Vendor
                  </Button>
                )}
                {delivery.status === 'at_vendor' && (
                  <Button
                    onClick={() => advance('picked')}
                    disabled={updating}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto whitespace-nowrap"
                    size="sm"
                  >
                    📦 Picked Order
                  </Button>
                )}
                {delivery.status === 'picked' && (
                  <>
                    <Button
                      onClick={() => advance('enroute')}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto whitespace-nowrap"
                      size="sm"
                    >
                      🚴‍♂️ En Route to Customer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {/* Simulate navigation */}}
                      className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto whitespace-nowrap"
                      size="sm"
                    >
                      🗺️ Navigate to Customer
                    </Button>
                  </>
                )}
                {delivery.status === 'enroute' && (
                  <Button
                    onClick={() => advance('delivered')}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto whitespace-nowrap"
                    size="sm"
                  >
                    ✅ Mark Delivered
                  </Button>
                )}
              </div>
              {deliveryError && (
                <p className="text-xs text-red-500 mt-2">
                  {deliveryError}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* approval gate */}
        {!profile.is_approved && (
          <Card className="border-amber-500 dark:border-amber-400 mb-8">
            <CardHeader>
              <CardTitle className="text-amber-500 dark:text-amber-400">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-300">
                Your rider application is currently under review. You'll be
                notified once approved and can start accepting delivery
                requests.
              </p>
            </CardContent>
          </Card>
        )}

        {/* main tabs - only when approved */}
        {profile.is_approved && (
          <>
            {activeTab === 'overview' && (
              <>
                {/* Available Deliveries */}
                <AvailableDeliveries
                  isOnline={online}
                  onDeliveryAccepted={handleDeliveryAccepted}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <Button
                          variant="outline"
                          className="justify-start dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                          onClick={() => handleOnlineToggle(true)}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          View Available Deliveries
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                          onClick={() => setActiveView('earnings')}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          View Earnings
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                          onClick={() => setActiveView('wallet')}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          Wallet & Payouts
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                          onClick={() => navigate('/support')}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Live Support
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-gray-100">Recent Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingRecent ? (
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Loading...</p>
                      ) : recentDeliveries.length > 0 ? (
                        <div className="space-y-3">
                          {recentDeliveries.slice(0, 3).map((delivery) => {
                            const d = delivery as { id: string; orders?: { vendor_profiles?: { business_name?: string }; delivery_address?: string }; delivery_fee?: number; delivery_time?: string };
                            return (
                            <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate dark:text-gray-100">
                                  {d.orders?.vendor_profiles?.business_name || 'Unknown Vendor'}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                                  {d.orders?.delivery_address || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                  KES {d.delivery_fee || 0}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                  {d.delivery_time ? new Date(d.delivery_time as string).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          );})}
                          {recentDeliveries.length > 3 && (
                            <Button variant="link" className="w-full text-xs p-0 h-auto dark:text-gray-300">
                              View All Recent Deliveries →
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground dark:text-gray-400">No recent deliveries</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Overview Stats - Moved to Bottom */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {/* Today Deliveries */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          Today's Deliveries
                        </CardTitle>
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl sm:text-3xl font-bold">
                          {stats.todayDeliveries}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          <p className="text-xs text-green-600 font-medium">
                            15% from yesterday
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">
                            Active: {stats.activeDeliveries}
                          </span>
                          <span className="text-gray-600">
                            Completed: {stats.completedDeliveries}
                          </span>
                        </div>
                        <Button
                          variant="link"
                          className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto"
                          size="sm"
                        >
                          View All Deliveries →
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Today's Earnings */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          Today's Earnings
                        </CardTitle>
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl sm:text-3xl font-bold">
                          KES {stats.todayEarnings.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          <p className="text-xs text-green-600 font-medium">
                            8% from yesterday
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                          <p className="text-xs sm:text-sm text-gray-600">
                            Weekly: KES {stats.weeklyEarnings.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="link"
                          className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto"
                          size="sm"
                          onClick={() => setActiveView('earnings')}
                        >
                          View Breakdown →
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Wallet Balance */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          Wallet Balance
                        </CardTitle>
                        <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl sm:text-3xl font-bold">
                          KES {walletBalance?.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                          Available for withdrawal
                        </p>
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                          <p className="text-xs sm:text-sm text-gray-600">
                            Pending: KES 0
                          </p>
                        </div>
                        <Button
                          variant="link"
                          className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto"
                          size="sm"
                        >
                          View Wallet →
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Performance Rating */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          Performance Rating
                        </CardTitle>
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="text-2xl sm:text-3xl font-bold">
                            {stats.rating.toFixed(1)}
                          </div>
                          <span className="text-lg sm:text-2xl">⭐</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                          {stats.totalDeliveries} total deliveries
                        </p>
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                          <p className="text-xs sm:text-sm text-gray-600">
                            Monthly: KES {stats.monthlyEarnings.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="link"
                          className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto"
                          size="sm"
                        >
                          View Analytics →
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Attention Needed */}
                    <Card className="hover:shadow-lg transition-shadow border-amber-200 bg-amber-50/50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                          Attention Needed
                        </CardTitle>
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1 sm:space-y-2">
                          {stats.pendingDeliveries > 0 && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 text-xs px-1 py-0"
                              >
                                ⚠️
                              </Badge>
                              <span className="text-xs sm:text-sm">
                                {stats.pendingDeliveries} Pending Deliveries
                              </span>
                            </div>
                          )}
                          {stats.lowBattery && (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-1 py-0"
                              >
                                🔋
                              </Badge>
                              <span className="text-xs sm:text-sm">
                                Low Battery ({status?.batteryPct}%)
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1 py-0"
                            >
                              ℹ️
                            </Badge>
                            <span className="text-xs sm:text-sm">
                              Location {isTracking ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="link"
                          className="w-full mt-2 sm:mt-3 text-xs p-0 h-auto"
                          size="sm"
                        >
                          View Details →
                        </Button>
                      </CardContent>
                    </Card>
                </div>
              </>
            )}

            {activeTab === 'active-orders' && (
              <ActiveDeliveries />
            )}

            {activeTab === 'customers' && (
              <RiderCustomerManagement />
            )}

            {activeTab === 'analytics' && (
              <RiderAnalytics />
            )}

            {activeTab === 'insights' && (
              <RiderBusinessInsights />
            )}

            {/* Earnings */}
            <Dialog
              open={activeView === 'earnings'}
              onOpenChange={(open) => !open && setActiveView(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Earnings</DialogTitle>
                </DialogHeader>
                <RiderEarnings riderId={riderProfileId} />
              </DialogContent>
            </Dialog>

            {/* Wallet */}
            <Dialog
              open={activeView === 'wallet'}
              onOpenChange={(open) => !open && setActiveView(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Wallet & Payouts</DialogTitle>
                </DialogHeader>
                <RiderWallet riderId={riderProfileId} />
              </DialogContent>
            </Dialog>

            {/* Communications */}
            <Dialog
              open={activeView === 'communications'}
              onOpenChange={(open) => !open && setActiveView(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Communications</DialogTitle>
                </DialogHeader>
                <RiderCommunications />
              </DialogContent>
            </Dialog>

            {/* Notifications */}
            <Dialog
              open={activeView === 'notifications'}
              onOpenChange={(open) => !open && setActiveView(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <RiderNotifications />
              </DialogContent>
            </Dialog>

            {/* Settings */}
            <Dialog
              open={showSettings}
              onOpenChange={setShowSettings}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Theme Settings */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Appearance</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme-toggle" className="text-sm text-gray-700 dark:text-gray-300">
                        Dark Mode
                      </Label>
                      <Switch
                        id="theme-toggle"
                        checked={theme === 'dark'}
                        onCheckedChange={() => toggleTheme()}
                      />
                    </div>
                  </div>

                  {/* Location Tracking */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Location</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor="location-toggle" className="text-sm text-gray-700 dark:text-gray-300">
                          Location Tracking
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Allow app to track your location for deliveries
                        </p>
                      </div>
                      <Switch
                        id="location-toggle"
                        checked={isTracking}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            startTracking();
                          } else {
                            stopTracking();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Online Status */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Status</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor="online-toggle-settings" className="text-sm text-gray-700 dark:text-gray-300">
                          Online Status
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {online ? 'Available for deliveries' : 'Offline - not receiving orders'}
                        </p>
                      </div>
                      <Switch
                        id="online-toggle-settings"
                        checked={online}
                        onCheckedChange={handleOnlineToggle}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Account</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate('/rider/profile')}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={signOut}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
}
