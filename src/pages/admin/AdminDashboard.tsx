import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Store, Building2, Bike, ShoppingCart, DollarSign,
  Truck, ClipboardList, CalendarDays, AlertCircle, ArrowRight, TrendingUp, AlertTriangle,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  activeVendors: number;
  approvedEstates: number;
  activeRiders: number;
  pendingVendors: number;
  pendingEstates: number;
  pendingRiders: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  activeDeliveries: number;
  openServiceRequests: number;
  pendingBookings: number;
  escalatedTickets: number;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};
const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, activeVendors: 0, approvedEstates: 0, activeRiders: 0,
    pendingVendors: 0, pendingEstates: 0, pendingRiders: 0,
    ordersToday: 0, ordersThisWeek: 0, ordersThisMonth: 0, revenueThisMonth: 0,
    activeDeliveries: 0, openServiceRequests: 0, pendingBookings: 0,
    escalatedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        userRoles, activeVendors, pendingVendors, approvedEstates, pendingEstates,
        activeRiders, pendingRiders,
        ordersToday, ordersThisWeek, ordersThisMonth, paidThisMonth,
        activeDeliveries, openServiceReqs, pendingBookings, recentOrdersData,
        escalatedTickets,
      ] = await Promise.all([
        supabase.from("user_roles").select("user_id"),
        supabase.from("vendor_profiles").select("*", { count: "exact", head: true }).eq("is_approved", true).eq("is_active", true),
        supabase.from("vendor_profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("estates").select("*", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("estates").select("*", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("rider_profiles").select("*", { count: "exact", head: true }).eq("is_approved", true).eq("is_active", true),
        supabase.from("rider_profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", startOfToday()),
        supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek()),
        supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth()),
        supabase.from("orders").select("total_amount").eq("payment_status", "paid").gte("created_at", startOfMonth()),
        supabase.from("deliveries").select("*", { count: "exact", head: true }).in("status", ["assigned", "picked_up", "in_transit", "heading_to_pickup"]),
        (supabase.from("service_requests") as any).select("*", { count: "exact", head: true }).in("status", ["pending", "assigned", "in_progress"]),
        (supabase.from("booking_reservations") as any).select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("id, order_number, full_name, total_amount, status, created_at").order("created_at", { ascending: false }).limit(5),
        (supabase.from("support_tickets") as any).select("*", { count: "exact", head: true }).eq("escalated_to_admin", true),
      ]);

      const totalUsers = new Set((userRoles.data || []).map((r: any) => r.user_id)).size;
      const revenueThisMonth = ((paidThisMonth.data as any[]) || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);

      setStats({
        totalUsers,
        activeVendors: activeVendors.count || 0,
        pendingVendors: pendingVendors.count || 0,
        approvedEstates: approvedEstates.count || 0,
        pendingEstates: pendingEstates.count || 0,
        activeRiders: activeRiders.count || 0,
        pendingRiders: pendingRiders.count || 0,
        ordersToday: ordersToday.count || 0,
        ordersThisWeek: ordersThisWeek.count || 0,
        ordersThisMonth: ordersThisMonth.count || 0,
        revenueThisMonth,
        activeDeliveries: activeDeliveries.count || 0,
        openServiceRequests: openServiceReqs.count || 0,
        pendingBookings: pendingBookings.count || 0,
        escalatedTickets: escalatedTickets.count || 0,
      });
      setRecentOrders((recentOrdersData.data as any[]) || []);
    } catch (e) {
      console.error("Stats error", e);
    }
    setLoading(false);
  };

  const totalPending = stats.pendingVendors + stats.pendingEstates + stats.pendingRiders;

  const statusColor = (s: string | null) => {
    switch (s) {
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Revenue this month" value={`KSh ${stats.revenueThisMonth.toLocaleString()}`} color="green" loading={loading} />
        <StatCard icon={ShoppingCart} label="Orders this month" value={stats.ordersThisMonth.toLocaleString()} sub={`${stats.ordersToday} today · ${stats.ordersThisWeek} this week`} color="blue" loading={loading} />
        <StatCard icon={Truck} label="Active deliveries" value={stats.activeDeliveries.toLocaleString()} color="purple" loading={loading} />
        <StatCard icon={TrendingUp} label="Total users" value={stats.totalUsers.toLocaleString()} color="slate" loading={loading} />
      </div>

      {/* Community stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Store} label="Active vendors" value={stats.activeVendors.toLocaleString()} color="emerald" loading={loading} />
        <StatCard icon={Building2} label="Approved estates" value={stats.approvedEstates.toLocaleString()} color="purple" loading={loading} />
        <StatCard icon={Bike} label="Active riders" value={stats.activeRiders.toLocaleString()} color="orange" loading={loading} />
        <StatCard icon={ClipboardList} label="Open service requests" value={stats.openServiceRequests.toLocaleString()} color="amber" loading={loading} />
      </div>

      {/* Escalated tickets alert */}
      {stats.escalatedTickets > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              {stats.escalatedTickets} ticket{stats.escalatedTickets === 1 ? "" : "s"} escalated by CSR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/admin/tickets">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-500 transition-colors flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Needs your attention</div>
                  <div className="text-sm font-medium">Open the support tickets queue</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pending approvals alert */}
      {totalPending > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
              {totalPending} pending {totalPending === 1 ? "approval" : "approvals"} need attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.pendingVendors > 0 && (
                <Link to="/admin/vendor-approvals">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-500 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Vendors</div>
                      <div className="text-xl font-bold">{stats.pendingVendors}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              )}
              {stats.pendingEstates > 0 && (
                <Link to="/admin/estate-approvals">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-500 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Estates</div>
                      <div className="text-xl font-bold">{stats.pendingEstates}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              )}
              {stats.pendingRiders > 0 && (
                <Link to="/admin/rider-approvals">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-500 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Riders</div>
                      <div className="text-xl font-bold">{stats.pendingRiders}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity + quick links */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No orders yet</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-slate-500">{o.order_number || o.id.slice(0, 8)}</div>
                      <div className="font-medium text-sm truncate">{o.full_name || "—"}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-sm font-semibold">KSh {Number(o.total_amount || 0).toLocaleString()}</div>
                      <Badge className={statusColor(o.status)}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink to="/admin/orders" icon={ShoppingCart} label="All orders" count={stats.ordersThisMonth} />
            <QuickLink to="/admin/deliveries" icon={Truck} label="Deliveries" count={stats.activeDeliveries} />
            <QuickLink to="/admin/bookings" icon={CalendarDays} label="Bookings" count={stats.pendingBookings} />
            <QuickLink to="/admin/service-requests" icon={ClipboardList} label="Service requests" count={stats.openServiceRequests} />
            <QuickLink to="/admin/analytics" icon={TrendingUp} label="Analytics" />
            <QuickLink to="/admin/users" icon={Users} label="Users" count={stats.totalUsers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ───────────── Stat Card ─────────────
const COLOR_MAP: Record<string, string> = {
  green: "from-emerald-500 to-emerald-600",
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  slate: "from-slate-500 to-slate-600",
  emerald: "from-emerald-500 to-emerald-600",
  orange: "from-orange-500 to-orange-600",
  amber: "from-amber-500 to-amber-600",
};

function StatCard({
  icon: Icon, label, value, sub, color = "slate", loading = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${COLOR_MAP[color] || COLOR_MAP.slate}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-bold">
          {loading ? <span className="text-slate-300">...</span> : value}
        </div>
        {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function QuickLink({
  to, icon: Icon, label, count,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="text-sm flex-1">{label}</span>
      {typeof count === "number" && (
        <Badge variant="outline" className="text-xs">{count}</Badge>
      )}
      <ArrowRight className="h-3 w-3 text-slate-400" />
    </Link>
  );
}
