import { supabase } from '@/lib/supabaseClient';
import type { RiderStatus, RiderLocation, ActiveDelivery } from '@/store/riderStore';

// Types for API responses
interface DeliveryOffer {
  id: string;
  delivery_order_id: string;
  rider_id: string;
  expires_at: string;
  created_at: string;
  delivery_order: {
    id: string;
    public_id: string;
    pickup_address: string;
    dropoff_address: string;
    distance_km: number;
    value_kes: number;
    created_at: string;
  };
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

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? {
      online: data.online || false,
      lastOnlineAt: data.last_online_at,
      activeTimeSeconds: data.active_time_seconds || 0,
      batteryPct: data.battery_pct,
      networkStrength: data.network_strength,
      storageFreeMb: data.storage_free_mb,
    } : null;
  },

  async updateStatus(riderId: string, updates: Partial<RiderStatus>): Promise<void> {
    const { error } = await supabase
      .from('rider_status')
      .upsert({
        rider_id: riderId,
        online: updates.online,
        last_online_at: updates.lastOnlineAt || new Date().toISOString(),
        active_time_seconds: updates.activeTimeSeconds,
        battery_pct: updates.batteryPct,
        network_strength: updates.networkStrength,
        storage_free_mb: updates.storageFreeMb,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },
};

// Location API
export const locationApi = {
  async logLocation(riderId: string, location: RiderLocation): Promise<void> {
    const { error } = await supabase
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
    const { data, error } = await supabase
      .from('rider_location_log')
      .select('*')
      .eq('rider_id', riderId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(row => ({
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
      .select(`
        *,
        delivery_offer (
          earnings_base_kes,
          earnings_distance_kes,
          earnings_peak_kes
        )
      `)
      .eq('rider_id', riderId)
      .in('status', ['assigned', 'picked', 'enroute'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      publicId: data.public_id,
      status: data.status,
      pickupAddress: data.pickup_address,
      dropoffAddress: data.dropoff_address,
      pickupLat: data.pickup_lat,
      pickupLng: data.pickup_lng,
      dropoffLat: data.dropoff_lat,
      dropoffLng: data.dropoff_lng,
      valueKes: data.value_kes,
      distanceKm: data.distance_km,
      pickupCode: data.pickup_code,
      deliveryCode: data.delivery_code,
      acceptedAt: data.accepted_at,
      pickedAt: data.picked_at,
      deliveredAt: data.delivered_at,
    };
  },

  async getDeliveryOffers(riderId: string): Promise<DeliveryOffer[]> {
    const { data, error } = await supabase
      .from('delivery_offer')
      .select(`
        *,
        delivery_order (
          id,
          public_id,
          pickup_address,
          dropoff_address,
          distance_km,
          value_kes,
          created_at
        )
      `)
      .eq('delivery_order.rider_id', riderId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async acceptDelivery(deliveryId: string, riderId: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_order')
      .update({
        rider_id: riderId,
        status: 'assigned',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
      .eq('rider_id', null); // Ensure it's not already assigned

    if (error) throw error;
  },

  async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    updates: Record<string, unknown> = {}
  ): Promise<void> {
    const statusUpdates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Add timestamp fields based on status
    if (status === 'picked') {
      statusUpdates.picked_at = new Date().toISOString();
    } else if (status === 'delivered') {
      statusUpdates.delivered_at = new Date().toISOString();
    } else if (status === 'canceled') {
      statusUpdates.canceled_at = new Date().toISOString();
    }

    // Merge additional updates
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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('rider_earnings')
      .select('total_kes')
      .eq('rider_id', riderId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) throw error;

    return data.reduce((sum, earning) => sum + (earning.total_kes || 0), 0);
  },

  async getWeeklyEarnings(riderId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('rider_earnings')
      .select('total_kes')
      .eq('rider_id', riderId)
      .gte('created_at', weekAgo.toISOString());

    if (error) throw error;

    return data.reduce((sum, earning) => sum + (earning.total_kes || 0), 0);
  },

  async getMonthlyEarnings(riderId: string): Promise<number> {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { data, error } = await supabase
      .from('rider_earnings')
      .select('total_kes')
      .eq('rider_id', riderId)
      .gte('created_at', monthAgo.toISOString());

    if (error) throw error;

    return data.reduce((sum, earning) => sum + (earning.total_kes || 0), 0);
  },
};

// Wallet API
export const walletApi = {
  async getBalance(riderId: string): Promise<number> {
    const { data, error } = await supabase
      .from('rider_wallet')
      .select('balance_kes')
      .eq('rider_id', riderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.balance_kes || 0;
  },

  async getTransactions(riderId: string, limit = 50): Promise<RiderTransaction[]> {
    const { data, error } = await supabase
      .from('rider_wallet_txn')
      .select('*')
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async requestPayout(
    riderId: string,
    amount: number,
    destination: string,
    destinationMask: string
  ): Promise<void> {
    const { error } = await supabase
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
