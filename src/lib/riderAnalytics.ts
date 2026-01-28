import { supabase } from '@/integrations/supabase/client';

export interface RiderStats {
  totalDeliveries: number;
  totalEarnings: number;
  averageRating: number;
  todayDeliveries: number;
  todayEarnings: number;
  weeklyDeliveries: number;
  weeklyEarnings: number;
  monthlyDeliveries: number;
  monthlyEarnings: number;
  walletBalance: number;
  pendingDeliveries: number;
  completedDeliveries: number;
}

export interface EarningsData {
  date: string;
  earnings: number;
  deliveries: number;
  tips: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface InsightsData {
  peakHours: string;
  avgDeliveryTime: number;
  weekendBonus: number;
  rating: number;
  weeklyDeliveries: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  monthlyTarget: number;
  weeklyTarget: number;
  ratingTarget: number;
}

export async function getRiderStats(riderId: string): Promise<RiderStats> {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's date range (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();

    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get total deliveries and earnings
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('delivery_fee, created_at, status')
      .eq('rider_id', riderId)
      .eq('status', 'delivered');

    if (deliveriesError) throw deliveriesError;

    const totalDeliveries = deliveries?.length || 0;
    const totalEarnings = deliveries?.reduce((sum, d) => sum + (d.delivery_fee || 0), 0) || 0;

    // Get today's deliveries and earnings
    const todayDeliveries = deliveries?.filter(d => {
      const deliveryDate = new Date(d.created_at);
      return deliveryDate >= today && deliveryDate < tomorrow;
    }) || [];

    const todayDeliveriesCount = todayDeliveries.length;
    const todayEarnings = todayDeliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0);

    // Get weekly deliveries and earnings
    const weeklyDeliveries = deliveries?.filter(d => {
      const deliveryDate = new Date(d.created_at);
      return deliveryDate >= weekStart && deliveryDate <= weekEnd;
    }) || [];

    const weeklyDeliveriesCount = weeklyDeliveries.length;
    const weeklyEarnings = weeklyDeliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0);

    // Get monthly deliveries and earnings
    const monthlyDeliveries = deliveries?.filter(d => {
      const deliveryDate = new Date(d.created_at);
      return deliveryDate >= monthStart && deliveryDate <= monthEnd;
    }) || [];

    const monthlyDeliveriesCount = monthlyDeliveries.length;
    const monthlyEarnings = monthlyDeliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0);

    // Get average rating
    // const { data: ratings, error: ratingsError } = await supabase
    //   .from('rider_ratings')
    //   .select('stars')
    //   .eq('rider_id', riderId);

    // if (ratingsError) throw ratingsError;

    // const averageRating = ratings && ratings.length > 0
    //   ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    //   : 0;
    const averageRating = 0;

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('rider_wallet')
      .select('balance_kes')
      .eq('rider_id', riderId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') throw walletError;

    const walletBalance = wallet?.balance_kes || 0;

    // Get active deliveries count
    const { data: activeDeliveries, error: activeError } = await supabase
      .from('deliveries')
      .select('id')
      .eq('rider_id', riderId)
      .in('status', ['assigned', 'picked', 'enroute']);

    if (activeError) throw activeError;

    const pendingDeliveries = activeDeliveries?.length || 0;

    return {
      totalDeliveries,
      totalEarnings,
      averageRating,
      todayDeliveries: todayDeliveriesCount,
      todayEarnings,
      weeklyDeliveries: weeklyDeliveriesCount,
      weeklyEarnings,
      monthlyDeliveries: monthlyDeliveriesCount,
      monthlyEarnings,
      walletBalance,
      pendingDeliveries,
      completedDeliveries: totalDeliveries,
    };
  } catch (error) {
    console.error('Error fetching rider stats:', error);
    throw error;
  }
}

export async function getActiveCustomers(riderId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('order_id')
      .eq('rider_id', riderId)
      .eq('status', 'delivered');

    if (error) {
      throw error;
    }

    if (!data) {
      return 0;
    }

    const uniqueOrderIds = [...new Set(data.map((d) => d.order_id))];
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_id')
      .in('id', uniqueOrderIds);

    if (ordersError) {
      throw ordersError;
    }

    if (!orders) {
      return 0;
    }

    const uniqueCustomerIds = [...new Set(orders.map((o) => o.customer_id))];
    return uniqueCustomerIds.length;
  } catch (error) {
    console.error('Error fetching active customers:', error);
    throw error;
  }
}

export async function getRiderEarnings(riderId: string, period: 'week' | 'month' | 'year' = 'week'): Promise<EarningsData[]> {
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const { data: earnings, error } = await supabase
      .from('rider_earnings')
      .select(`
        total_kes,
        tip_kes,
        created_at,
        delivery_order:order_id (
          id
        )
      `)
      .eq('rider_id', riderId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const earningsByDate: { [key: string]: { earnings: number; deliveries: number; tips: number } } = {};

    earnings?.forEach(earning => {
      const date = new Date(earning.created_at).toISOString().split('T')[0];
      if (!earningsByDate[date]) {
        earningsByDate[date] = { earnings: 0, deliveries: 0, tips: 0 };
      }
      earningsByDate[date].earnings += earning.total_kes || 0;
      earningsByDate[date].deliveries += 1;
      earningsByDate[date].tips += earning.tip_kes || 0;
    });

    return Object.entries(earningsByDate).map(([date, data]) => ({
      date,
      earnings: data.earnings,
      deliveries: data.deliveries,
      tips: data.tips,
    }));
  } catch (error) {
    console.error('Error fetching rider earnings:', error);
    throw error;
  }
}

export async function getRiderWalletTransactions(riderId: string): Promise<Transaction[]> {
  try {
    const { data: transactions, error } = await supabase
      .from('rider_wallet_txn')
      .select('*')
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return transactions?.map(txn => ({
      id: txn.id,
      type: txn.type as 'credit' | 'debit',
      amount: txn.amount_kes,
      description: txn.ref || `${txn.type === 'credit' ? 'Deposit' : 'Withdrawal'}`,
      date: new Date(txn.created_at).toLocaleDateString(),
      status: 'completed' as const, // Assuming all transactions are completed
    })) || [];
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    throw error;
  }
}

export async function getRiderInsights(riderId: string): Promise<InsightsData> {
  try {
    // Get delivery data for insights
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('created_at, delivery_fee')
      .eq('rider_id', riderId)
      .eq('status', 'delivered');

    if (deliveriesError) throw deliveriesError;

    // Calculate peak hours (simplified - most deliveries by hour)
    const hourCounts: { [key: number]: number } = {};
    deliveries?.forEach(d => {
      const hour = new Date(d.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).reduce((a, b) =>
      hourCounts[parseInt(a[0])] > hourCounts[parseInt(b[0])] ? a : b
    )?.[0];

    const peakHours = peakHour ? `${peakHour}:00-${parseInt(peakHour) + 2}:00` : '12-2 PM';

    // Get ratings
    // const { data: ratings, error: ratingsError } = await supabase
    //   .from('rider_ratings')
    //   .select('stars')
    //   .eq('rider_id', riderId);

    // if (ratingsError) throw ratingsError;

    // const rating = ratings && ratings.length > 0
    //   ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    //   : 4.5;
    const rating = 4.5;

    // Calculate weekly/monthly stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);

    const weeklyDeliveries = deliveries?.filter(d =>
      new Date(d.created_at) >= weekStart
    ).length || 0;

    const weeklyEarnings = deliveries?.filter(d =>
      new Date(d.created_at) >= weekStart
    ).reduce((sum, d) => sum + (d.delivery_fee || 0), 0) || 0;

    const monthlyEarnings = deliveries?.filter(d =>
      new Date(d.created_at) >= monthStart
    ).reduce((sum, d) => sum + (d.delivery_fee || 0), 0) || 0;

    return {
      peakHours,
      avgDeliveryTime: 25, // Placeholder - would need delivery time tracking
      weekendBonus: 35, // Placeholder - would need weekend calculation
      rating,
      weeklyDeliveries,
      weeklyEarnings,
      monthlyEarnings,
      monthlyTarget: 25000, // Could be from rider_goals table
      weeklyTarget: 35, // Could be from rider_goals table
      ratingTarget: 5.0,
    };
  } catch (error) {
    console.error('Error fetching rider insights:', error);
    throw error;
  }
}

export async function getRecentDeliveries(riderId: string, limit: number = 5) {
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
      .eq('rider_id', riderId)
      .eq('status', 'delivered')
      .order('delivery_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent deliveries:', error);
    throw error;
  }
}
