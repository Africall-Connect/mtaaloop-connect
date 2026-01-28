import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Store,
  Building2,
  Bike,
  Clock,
  LogOut,
  UserCog,
  CheckCircle,
  XCircle,
  MessageSquare,
  ShoppingCart,
  Activity,
  DollarSign
} from 'lucide-react';

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeVendors: 0,
    approvedEstates: 0,
    activeRiders: 0,
    pendingVendors: 0,
    pendingEstates: 0,
    pendingRiders: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users from user_roles
      const { count: totalUsers } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      // Get vendor stats
      const { count: activeVendors } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)
        .eq('is_active', true);

      const { count: pendingVendors } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      // Get estate stats
      const { count: approvedEstates } = await supabase
        .from('estates')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)
        .eq('is_active', true);

      const { count: pendingEstates } = await supabase
        .from('estates')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      // Get rider stats
      const { count: activeRiders } = await supabase
        .from('rider_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)
        .eq('is_active', true);

      const { count: pendingRiders } = await supabase
        .from('rider_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      setStats({
        totalUsers: totalUsers || 0,
        activeVendors: activeVendors || 0,
        approvedEstates: approvedEstates || 0,
        activeRiders: activeRiders || 0,
        pendingVendors: pendingVendors || 0,
        pendingEstates: pendingEstates || 0,
        pendingRiders: pendingRiders || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const totalPending = stats.pendingVendors + stats.pendingEstates + stats.pendingRiders;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="relative overflow-hidden border-b bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-800 shadow-lg">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
        <div className="relative container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Admin Panel</h1>
            <p className="text-sm text-blue-100">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3 animate-fade-in animation-delay-200">
            <Button onClick={() => navigate('/admin/inbox')} className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Inbox
            </Button>
            <Button onClick={() => navigate('/admin/live-chat-assign')} variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
              <Activity className="mr-2 h-4 w-4" />
              Assign Chats
            </Button>
            <Button onClick={signOut} variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-700 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Users</CardTitle>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-blue-600 dark:text-blue-300 font-medium">Registered accounts</div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-700 animate-fade-in animation-delay-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Active Vendors</CardTitle>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Store className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{stats.activeVendors.toLocaleString()}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">Approved & active</div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-700 animate-fade-in animation-delay-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Approved Estates</CardTitle>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{stats.approvedEstates.toLocaleString()}</div>
              <div className="text-xs text-purple-600 dark:text-purple-300 font-medium">Verified locations</div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-700 animate-fade-in animation-delay-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Active Riders</CardTitle>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Bike className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{stats.activeRiders.toLocaleString()}</div>
              <div className="text-xs text-orange-600 dark:text-orange-300 font-medium">Available for delivery</div>
            </CardContent>
          </Card>
        </div>

        {totalPending > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-300 dark:border-amber-700 shadow-lg animate-fade-in animation-delay-400">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-4">{totalPending}</div>
              <div className="grid gap-3 md:grid-cols-3">
                {stats.pendingVendors > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Vendors</span>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.pendingVendors}</span>
                    </div>
                    <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2 mt-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{width: `${Math.min((stats.pendingVendors / totalPending) * 100, 100)}%`}}></div>
                    </div>
                  </div>
                )}
                {stats.pendingEstates > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Estates</span>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.pendingEstates}</span>
                    </div>
                    <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2 mt-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{width: `${Math.min((stats.pendingEstates / totalPending) * 100, 100)}%`}}></div>
                    </div>
                  </div>
                )}
                {stats.pendingRiders > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Riders</span>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.pendingRiders}</span>
                    </div>
                    <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2 mt-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{width: `${Math.min((stats.pendingRiders / totalPending) * 100, 100)}%`}}></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 animate-fade-in animation-delay-500">
            <Link to="/admin/users" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                  <div className="p-3 bg-slate-500 rounded-xl group-hover:bg-slate-600 transition-colors">
                    <UserCog className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">User Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Manage user accounts and role assignments across the platform
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-700 animate-fade-in animation-delay-600">
            <Link to="/admin/vendor-approvals" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-amber-900 dark:text-amber-100">
                  <div className="p-3 bg-amber-500 rounded-xl group-hover:bg-amber-600 transition-colors">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Vendor Approvals</span>
                  {stats.pendingVendors > 0 && (
                    <span className="ml-auto text-sm bg-amber-500 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                      {stats.pendingVendors}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-amber-700 dark:text-amber-200 leading-relaxed">
                  Review and approve new vendor applications for the marketplace
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-700 animate-fade-in animation-delay-700">
            <Link to="/admin/estate-approvals" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-purple-900 dark:text-purple-100">
                  <div className="p-3 bg-purple-500 rounded-xl group-hover:bg-purple-600 transition-colors">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Estate Approvals</span>
                  {stats.pendingEstates > 0 && (
                    <span className="ml-auto text-sm bg-purple-500 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                      {stats.pendingEstates}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-purple-700 dark:text-purple-200 leading-relaxed">
                  Review and approve estate registrations and location data
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-700 animate-fade-in animation-delay-800">
            <Link to="/admin/estates" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-indigo-900 dark:text-indigo-100">
                  <div className="p-3 bg-indigo-500 rounded-xl group-hover:bg-indigo-600 transition-colors">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Estate Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-indigo-700 dark:text-indigo-200 leading-relaxed">
                  Manage approved estates and their operational settings
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-700 animate-fade-in animation-delay-900">
            <Link to="/admin/rider-approvals" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-orange-900 dark:text-orange-100">
                  <div className="p-3 bg-orange-500 rounded-xl group-hover:bg-orange-600 transition-colors">
                    <Bike className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Rider Approvals</span>
                  {stats.pendingRiders > 0 && (
                    <span className="ml-auto text-sm bg-orange-500 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                      {stats.pendingRiders}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-orange-700 dark:text-orange-200 leading-relaxed">
                  Review and approve rider applications for delivery services
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-700 animate-fade-in animation-delay-1000">
            <Link to="/admin/live-chat-assign" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-cyan-900 dark:text-cyan-100">
                  <div className="p-3 bg-cyan-500 rounded-xl group-hover:bg-cyan-600 transition-colors">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Chat Assignment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-cyan-700 dark:text-cyan-200 leading-relaxed">
                  Assign unassigned support chats to available administrators
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-700 animate-fade-in animation-delay-1100">
            <Link to="/admin/manage-mtaaloop-mart" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-emerald-900 dark:text-emerald-100">
                  <div className="p-3 bg-emerald-500 rounded-xl group-hover:bg-emerald-600 transition-colors">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">MtaaLoop Mart</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-emerald-700 dark:text-emerald-200 leading-relaxed">
                  Manage products and inventory in the MtaaLoop marketplace
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-700 animate-fade-in animation-delay-1200">
            <Link to="/admin/payouts" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-green-900 dark:text-green-100">
                  <div className="p-3 bg-green-500 rounded-xl group-hover:bg-green-600 transition-colors">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Vendor Payouts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-green-700 dark:text-green-200 leading-relaxed">
                  Simulate and record vendor payouts that are pending settlement.
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-700 animate-fade-in animation-delay-1300">
            <Link to="/admin/compliance" className="block h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-teal-900 dark:text-teal-100">
                  <div className="p-3 bg-teal-500 rounded-xl group-hover:bg-teal-600 transition-colors">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Business Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-teal-700 dark:text-teal-200 leading-relaxed">
                  Monitor and manage compliance across all MtaaLoop business categories.
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
