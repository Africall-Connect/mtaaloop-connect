import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, TrendingUp, Award, MessageSquare, Mail, Phone, Eye, ShoppingBag, DollarSign, ArrowLeft } from 'lucide-react';
import CustomerDetailPanel from '@/components/vendor/customer/CustomerDetailPanel';
import CustomerSegments from '@/components/vendor/customer/CustomerSegments';

interface Customer {
  id: string;
  display_name: string | null;
  email: string;
  phone: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string | null;
  segment: string;
  address?: string;
}

export default function MinimartCustomerManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showSegments, setShowSegments] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      if (!user) return;
      const { data: vendorProfile } = await supabase.from('vendor_profiles').select('id').eq('user_id', user.id).single();
      if (!vendorProfile) {
        setCustomers([]);
        return;
      }

      const { data: orders } = await supabase.from('premium_orders').select('customer_id, total_amount, created_at').eq('vendor_id', vendorProfile.id).not('customer_id', 'is', null);
      if (!orders || orders.length === 0) {
        setCustomers([]);
        return;
      }

      const customerIds = [...new Set(orders.map(o => o.customer_id))].filter(Boolean);
      const { data: appUsers } = await supabase.from('app_users').select('id, first_name, last_name, email, phone').in('id', customerIds);

      const userMap = new Map();
      appUsers?.forEach(u => {
        const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        userMap.set(u.id, {
          display_name: name || u.email?.split('@')[0] || 'Customer',
          email: u.email || 'unknown@example.com',
          phone: u.phone || '',
        });
      });

      const agg = new Map();
      orders.forEach(o => {
        const id = o.customer_id!;
        if (!agg.has(id)) {
          agg.set(id, { id, orders: [], totalSpent: 0, orderCount: 0 });
        }
        const c = agg.get(id);
        c.orders.push(o);
        c.totalSpent += Number(o.total_amount);
        c.orderCount++;
      });

      const enriched: Customer[] = Array.from(agg.values()).map(c => {
        const lastOrder = c.orders.sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())[0];
        const info = userMap.get(c.id) || { display_name: 'Customer', email: 'Unknown@example.com', phone: '' };
        const avg = c.orderCount ? c.totalSpent / c.orderCount : 0;
        let segment = 'New';
        if (c.orderCount >= 10 && avg >= 2000) segment = 'VIP';
        else if (c.orderCount >= 5) segment = 'Regular';
        else if (c.orderCount >= 2) segment = 'Returning';
        return {
          id: c.id,
          display_name: info.display_name,
          email: info.email,
          phone: info.phone,
          created_at: lastOrder?.created_at || new Date().toISOString(),
          order_count: c.orderCount,
          total_spent: c.totalSpent,
          avg_order_value: avg,
          last_order_date: lastOrder?.created_at || null,
          segment,
        };
      });
      setCustomers(enriched);
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user, fetchCustomers]);

  const getDisplayName = (c: Customer) => c.display_name ?? c.email.split('@')[0] ?? 'Customer';
  const getCustomerStats = () => {
    const total = customers.length;
    const vip = customers.filter(c => c.segment === 'VIP').length;
    const regular = customers.filter(c => c.segment === 'Regular').length;
    const returning = customers.filter(c => c.segment === 'Returning').length;
    const newC = customers.filter(c => c.segment === 'New').length;
    const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
    const avgLTV = total ? totalRevenue / total : 0;
    return { total, vip, regular, returning, newC, totalRevenue, avgLTV };
  };
  const getTimeAgo = (date: string | null) => {
    if (!date) return 'Never';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };
  const getSegmentBadge = (seg: string) => {
    const map: Record<string, string> = {
      VIP: 'bg-purple-100 text-purple-800 border-purple-300',
      Regular: 'bg-blue-100 text-blue-800 border-blue-300',
      Returning: 'bg-green-100 text-green-800 border-green-300',
      New: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return map[seg] ?? map.New;
  };
  const stats = getCustomerStats();

  let list = [...customers];
  if (segmentFilter !== 'all') list = list.filter(c => c.segment.toLowerCase() === segmentFilter);
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    list = list.filter(c => getDisplayName(c).toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || c.phone.includes(term));
  }
  if (sortBy === 'spending_high') list.sort((a, b) => b.total_spent - a.total_spent);
  else if (sortBy === 'orders_high') list.sort((a, b) => b.order_count - a.order_count);
  else if (sortBy === 'recent') list.sort((a, b) => new Date(b.last_order_date!).getTime() - new Date(a.last_order_date!).getTime());

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  const StatCard = ({ icon, title, value, colorClass, isCurrency = false }: { icon: React.ReactElement; title: string; value: number; colorClass: string; isCurrency?: boolean; }) => (
    <Card className={`${colorClass} text-white shadow-lg border-0`}><CardContent className="p-4 flex items-center gap-4"><div className="p-3 bg-white/20 rounded-lg">{React.cloneElement(icon, { className: 'h-6 w-6 text-white' })}</div><div><div className="text-2xl font-bold">{isCurrency ? `KES ${Number(value).toLocaleString()}` : value}</div><div className="text-sm font-light opacity-90">{title}</div></div></CardContent></Card>
  );

  const CustomerCard = (customer: Customer) => {
    const name = getDisplayName(customer);
    const avatarLetter = name.charAt(0).toUpperCase();
    return (
      <Card key={customer.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${customer.segment === 'VIP' ? 'bg-gradient-to-br from-purple-500 to-pink-600' : customer.segment === 'Regular' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : customer.segment === 'Returning' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-500 to-slate-600'}`}>{avatarLetter}</div>
                <div><h3 className="text-lg font-semibold">{name}</h3><div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="h-3 w-3" />{customer.email}{customer.phone && (<><span>•</span><Phone className="h-3 w-3" />{customer.phone}</>)}</div></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div><p className="text-sm text-gray-600">Orders</p><div className="flex items-center gap-1"><ShoppingBag className="h-4 w-4 text-blue-600" /><p className="text-lg font-bold">{customer.order_count}</p></div></div>
                <div><p className="text-sm text-gray-600">Spent</p><div className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-green-600" /><p className="text-lg font-bold">KES {customer.total_spent.toLocaleString()}</p></div></div>
                <div><p className="text-sm text-gray-600">Avg Order</p><p className="text-lg font-bold">KES {Math.round(customer.avg_order_value).toLocaleString()}</p></div>
                <div><p className="text-sm text-gray-600">Last Order</p><p className="text-lg font-bold">{getTimeAgo(customer.last_order_date)}</p></div>
              </div>
              <div className="flex items-center gap-2 mb-4"><Badge className={getSegmentBadge(customer.segment)}>{customer.segment}</Badge><Badge variant="outline">Member since {new Date(customer.created_at).toLocaleDateString()}</Badge></div>
              <div className="flex flex-wrap gap-2 pt-4 border-t"><Button size="sm" onClick={() => setSelectedCustomer(customer.id)}><Eye className="h-4 w-4 mr-1" />View Details</Button><Button size="sm" variant="outline"><MessageSquare className="h-4 w-4 mr-1" />Message</Button><Button size="sm" variant="outline"><Mail className="h-4 w-4 mr-1" />Email</Button><Button size="sm" variant="outline">Order History</Button></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => navigate('/vendor/portal')}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-2xl font-bold text-gray-900">MINIMART CUSTOMERS</h1></div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setShowSegments(true)}><Users className="h-4 w-4 mr-2" />Customer Segments</Button><Button><Mail className="h-4 w-4 mr-2" />Send Campaign</Button></div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"><StatCard title="Total Customers" value={stats.total} icon={<Users />} colorClass="bg-gradient-to-br from-blue-500 to-blue-600" /><StatCard title="VIP Customers" value={stats.vip} icon={<Award />} colorClass="bg-gradient-to-br from-purple-500 to-purple-600" /><StatCard title="Regular Customers" value={stats.regular} icon={<TrendingUp />} colorClass="bg-gradient-to-br from-green-500 to-green-600" /><StatCard title="Total Revenue" value={stats.totalRevenue} icon={<DollarSign />} colorClass="bg-gradient-to-br from-amber-500 to-amber-600" isCurrency /><StatCard title="Avg. Customer Value" value={Math.round(stats.avgLTV)} icon={<DollarSign />} colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600" isCurrency /></div>
        <Card><CardContent className="p-6"><div className="flex flex-col sm:flex-row gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by name, email, phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">Recent Activity</SelectItem><SelectItem value="spending_high">Highest Spending</SelectItem><SelectItem value="orders_high">Most Orders</SelectItem></SelectContent></Select></div></CardContent></Card>
        <Tabs defaultValue="all">
          <TabsList className="w-full justify-start bg-white border"><TabsTrigger value="all">All <Badge variant="secondary" className="ml-2">{stats.total}</Badge></TabsTrigger><TabsTrigger value="vip">VIP <Badge variant="secondary" className="ml-2">{stats.vip}</Badge></TabsTrigger><TabsTrigger value="regular">Regular <Badge variant="secondary" className="ml-2">{stats.regular}</Badge></TabsTrigger><TabsTrigger value="returning">Returning <Badge variant="secondary" className="ml-2">{stats.returning}</Badge></TabsTrigger><TabsTrigger value="new">New <Badge variant="secondary" className="ml-2">{stats.newC}</Badge></TabsTrigger></TabsList>
          {(['all', 'vip', 'regular', 'returning', 'new'] as const).map(tab => {
            const tabCustomers = tab === 'all' ? list : customers.filter(c => c.segment.toLowerCase() === tab);
            return <TabsContent key={tab} value={tab} className="mt-4 space-y-4">{tabCustomers.length === 0 ? <Card><CardContent className="p-12 text-center text-gray-500">No customers in this segment</CardContent></Card> : <div className="grid gap-4">{tabCustomers.map(CustomerCard)}</div>}</TabsContent>;
          })}
        </Tabs>
      </main>
      {selectedCustomer && <CustomerDetailPanel customerId={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
      {showSegments && <CustomerSegments customers={customers} onClose={() => setShowSegments(false)} />}
    </div>
  );
}
