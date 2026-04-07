import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";

type RangeKey = "7d" | "30d" | "90d" | "365d";

const RANGE_LABELS: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "365d": "Last year",
};

const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  ordersByDay: { date: string; count: number; revenue: number }[];
  statusBreakdown: { name: string; value: number }[];
  topVendors: { name: string; revenue: number }[];
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const days = RANGE_DAYS[range];
    const since = subDays(new Date(), days).toISOString();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total_amount, status, vendor_id, customer_id, created_at")
      .gte("created_at", since)
      .limit(5000);

    const rows = (orders as any[]) || [];

    // Initialize day buckets
    const dayBuckets: Record<string, { count: number; revenue: number }> = {};
    const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
    interval.forEach(d => {
      dayBuckets[format(d, "MMM dd")] = { count: 0, revenue: 0 };
    });

    const statusCounts: Record<string, number> = {};
    const vendorRevenue: Record<string, number> = {};
    const customerIds = new Set<string>();
    let totalRevenue = 0;

    rows.forEach(o => {
      const day = format(startOfDay(new Date(o.created_at)), "MMM dd");
      if (dayBuckets[day]) {
        dayBuckets[day].count++;
        dayBuckets[day].revenue += Number(o.total_amount || 0);
      }
      const s = o.status || "unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      if (o.vendor_id) {
        vendorRevenue[o.vendor_id] = (vendorRevenue[o.vendor_id] || 0) + Number(o.total_amount || 0);
      }
      if (o.customer_id) customerIds.add(o.customer_id);
      totalRevenue += Number(o.total_amount || 0);
    });

    const ordersByDay = Object.entries(dayBuckets).map(([date, v]) => ({ date, count: v.count, revenue: v.revenue }));
    const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const topVendors = Object.entries(vendorRevenue)
      .map(([id, revenue]) => ({ name: id.slice(0, 8), revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setStats({
      totalRevenue,
      totalOrders: rows.length,
      totalCustomers: customerIds.size,
      avgOrderValue: rows.length ? totalRevenue / rows.length : 0,
      ordersByDay,
      statusBreakdown,
      topVendors,
    });
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Platform Analytics</h2>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-40 ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABELS) as RangeKey[]).map(k => (
              <SelectItem key={k} value={k}>{RANGE_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading || !stats ? (
        <Card><CardContent className="p-8 text-center text-slate-500">Loading analytics...</CardContent></Card>
      ) : (
        <>
          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500"><DollarSign className="h-4 w-4" /> Revenue</div>
                <div className="text-2xl font-bold mt-1">KSh {stats.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500"><ShoppingCart className="h-4 w-4" /> Orders</div>
                <div className="text-2xl font-bold mt-1">{stats.totalOrders.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500"><Users className="h-4 w-4" /> Customers</div>
                <div className="text-2xl font-bold mt-1">{stats.totalCustomers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500"><TrendingUp className="h-4 w-4" /> Avg Order</div>
                <div className="text-2xl font-bold mt-1">KSh {Math.round(stats.avgOrderValue).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Orders over time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.ordersByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Revenue over time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.ordersByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Order status breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stats.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {stats.statusBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top 10 vendors by revenue</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.topVendors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
