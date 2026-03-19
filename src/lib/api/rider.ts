import { supabase } from '@/lib/supabaseClient';
import type { RiderStatus, RiderLocation, ActiveDelivery } from '@/store/riderStore';

const db = supabase as any;

// Types for API responses
interface DeliveryOffer {
  id: string;
  delivery_order_id: string;
  rider_id: string;
  expires_at: string;
  created_at: string;
  delivery_order: any;
}

interface RiderTransaction {
  id: string;
  rider_id: string;
  amount_kes: number;
  type: string;
  description: string;
  created_at: string;
  reference: string | null;
}

// Rider Status API
export const riderStatusApi = {
  async getStatus(riderId: string): Promise<RiderStatus | null> {
    const { data, error } = await supabase
      .from('rider_status')
      .select('*')
      .eq('rider_id', riderId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data ? {
      online: (data as any).online || false,
      lastOnlineAt: (data as any).last_online_at,
      activeTimeSeconds: (data as any).active_time_seconds || 0,
      batteryPct: (data as any).battery_pct,
      networkStrength: (data as any).network_strength,
      storageFreeMb: (data as any).storage_free_mb,
    } : null;
  },

  async updateStatus(riderId: string, updates: Partial<RiderStatus>): Promise<void> {
    const { error } = await supabase
      .from('rider_status')
      .upsert({
        rider_id: riderId,
        online: updates.online,
        last_online_at: updates.lastOnlineAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

    if (error) throw error;
  },
};

// Location API
export const locationApi = {
  async logLocation(riderId: string, location: RiderLocation): Promise<void> {
    const { error } = await db
      .from('rider_location_log')
      .insert({
        rider_id: riderId,
        lat: location.lat,
        lng: location.lng,
        speed_kmh: location.speed || 0,
        heading: location.heading,
        altitude_m: location.altitude,
        accuracy_m: location.accuracy,
        recorded_at: new Date(location.timestamp).toISOString(),
      });

    if (error) throw error;
  },

  async getRecentLocations(riderId: string, limit = 100): Promise<RiderLocation[]> {
    const { data, error } = await db
      .from('rider_location_log')
      .select('*')
      .eq('rider_id', riderId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      lat: row.lat,
      lng: row.lng,
      accuracy: row.accuracy_m,
      speed: row.speed_kmh,
      heading: row.heading,
      altitude: row.altitude_m,
      timestamp: new Date(row.recorded_at).getTime(),
    }));
  },
};

// Delivery API
export const deliveryApi = {
  async getActiveDelivery(riderId: string): Promise<ActiveDelivery | null> {
    const { data, error } = await supabase
      .from('delivery_order')
      .select('*')
      .eq('rider_id', riderId)
      .in('status', ['assigned', 'picked', 'enroute'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const d = data as any;
    return {
      id: d.id,
      publicId: d.public_id,
      status: d.status,
      pickupAddress: d.pickup_address,
      dropoffAddress: d.dropoff_address,
      pickupLat: d.pickup_lat,
      pickupLng: d.pickup_lng,
      dropoffLat: d.dropoff_lat,
      dropoffLng: d.dropoff_lng,
      valueKes: d.order_value || 0,
      distanceKm: d.distance_km,
      pickupCode: d.delivery_code,
      deliveryCode: d.delivery_code,
      acceptedAt: d.accepted_at,
      pickedAt: d.picked_at,
      deliveredAt: d.delivered_at,
    };
  },

  async getDeliveryOffers(riderId: string): Promise<DeliveryOffer[]> {
    const { data, error } = await supabase
      .from('delivery_offer')
      .select('*, delivery_order(*)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any) || [];
  },

  async acceptDelivery(deliveryId: string, riderId: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_order')
      .update({
        rider_id: riderId,
        status: 'assigned',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    if (error) throw error;
  },

  async updateDeliveryStatus(deliveryId: string, status: string, updates: Record<string, unknown> = {}): Promise<void> {
    const statusUpdates: Record<string, unknown> = { status };
    if (status === 'picked') statusUpdates.picked_at = new Date().toISOString();
    else if (status === 'delivered') statusUpdates.delivered_at = new Date().toISOString();
    else if (status === 'canceled') statusUpdates.canceled_at = new Date().toISOString();
    Object.assign(statusUpdates, updates);

    const { error } = await supabase
      .from('delivery_order')
      .update(statusUpdates)
      .eq('id', deliveryId);

    if (error) throw error;
  },
};

// Earnings API
export const earningsApi = {
  async getTodaysEarnings(riderId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await db
      .from('rider_earnings')
      .select('total_kes')
      .eq('rider_id', riderId)
      .gte('created_at', today.toISOString());

    if (error) throw error;
    return (data || []).reduce((sum: number, e: any) => sum + (e.total_kes || 0), 0);
  },

  async getWeeklyEarnings(riderId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data, error } = await db
      .from('rider_earnings')
      .select('total_kes')
      .eq('rider_id', riderId)
      .gte('created_at', weekAgo.toISOString());

    if (error) throw error;
    return (data || []).reduce((sum: number, e: any) => sum + (e.total_kes || 0), 0);
  },

  async getMonthlyEarnings(riderId: string): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const { data, error } = await db
      .from('rider_earnings')
      .select('total_kes')
      .eq('rider_id', riderId)
      .gte('created_at', monthAgo.toISOString());

    if (error) throw error;
    return (data || []).reduce((sum: number, e: any) => sum + (e.total_kes || 0), 0);
  },
};

// Wallet API
export const walletApi = {
  async getBalance(riderId: string): Promise<number> {
    const { data, error } = await supabase
      .from('rider_wallet')
      .select('balance')
      .eq('rider_id', riderId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as any)?.balance || 0;
  },

  async getTransactions(riderId: string, limit = 50): Promise<RiderTransaction[]> {
    const { data, error } = await db
      .from('rider_wallet_txn')
      .select('*')
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as any) || [];
  },

  async requestPayout(riderId: string, amount: number, destination: string, destinationMask: string): Promise<void> {
    const { error } = await db
      .from('rider_payout')
      .insert({
        rider_id: riderId,
        amount_kes: amount,
        destination,
        destination_mask: destinationMask,
        requested_at: new Date().toISOString(),
      });

    if (error) throw error;
  },
};
