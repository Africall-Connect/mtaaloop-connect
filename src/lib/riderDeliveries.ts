import { supabase } from '../integrations/supabase/client';
import { 
  fetchAvailableTrashDeliveries, 
  fetchActiveTrashDeliveries,
  AvailableTrashDelivery,
  ActiveTrashDelivery
} from './trashDeliveries';

// NOTE: This rider flow uses `deliveries` (orders → deliveries).
// Do NOT use `delivery_order` here. That is a separate workflow.

export interface AvailableDelivery {
  id: string;
  status: string;
  created_at: string;
  type: 'normal' | 'premium' | 'trash';
  order: {
    id: string;
    order_number?: string; // Not available on premium orders
    delivery_address?: string;
    house?: string;
    full_name: string | null;
    customer_notes?: string | null;
    amount?: number;
    customer: {
      first_name: string | null;
      last_name: string | null;
      phone: string;
      email: string;
    };
    vendor?: { // Not available on premium orders
      business_name: string;
      business_phone: string;
    };
  };
}

export interface ActiveDelivery {
  id: string;
  status: string;
  created_at: string;
  type: 'normal' | 'premium' | 'trash';
  order: {
    id: string;
    order_number?: string;
    status: string;
    total_amount?: number;
    amount?: number;
    delivery_address?: string;
    house?: string;
    customer_notes: string | null;
    created_at: string;
    full_name: string | null;
    payment_method?: string;
    payment_status?: string;
    customer: {
      first_name: string | null;
      last_name: string | null;
      phone: string;
      email: string;
    };
    order_items?: Array<{
      product_name: string;
      quantity: number;
    }>;
    vendor?: {
      business_name: string;
      business_phone: string;
    };
  };
}

async function getRiderProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: profile, error } = await supabase
    .from('rider_profiles')
    .select('id, estate_id')
    .eq('user_id', user.id)
    .single();

  if (error) throw new Error(error.message);
  if (!profile) throw new Error("Rider profile not found");

  return profile;
}

async function fetchNormalDeliveries(estateId: string | null): Promise<AvailableDelivery[]> {
  try {
    let query = supabase
      .from("deliveries")
      .select(`
        id,
        status,
        created_at,
        orders (
          id,
          order_number,
          delivery_address,
          full_name,
        customer:app_users!orders_customer_id_fkey (
          first_name,
          last_name,
          phone,
          email
        ),
          vendor:vendor_profiles (
            business_name,
            business_phone
          )
        )
      `)
      .eq("status", "pending")
      .is("rider_id", null);

    // Broaden filter: include matching estate OR null estate deliveries
    if (estateId) {
      query = query.or(`estate_id.eq.${estateId},estate_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    console.log(`[RiderDeliveries] fetchNormalDeliveries: ${data?.length ?? 0} pending deliveries found`);
    
    return data.map(d => {
      const orderData = Array.isArray(d.orders) ? d.orders[0] : d.orders;
      return {
        id: d.id,
        status: d.status,
        created_at: d.created_at,
        type: 'normal',
        order: {
          ...orderData,
          customer: Array.isArray(orderData.customer) ? orderData.customer[0] : orderData.customer,
          vendor: Array.isArray(orderData.vendor) ? orderData.vendor[0] : orderData.vendor,
        }
      };
    }) || [];
  } catch (error) {
    console.error("Error fetching normal deliveries:", error);
    throw error;
  }
}

async function fetchPremiumDeliveries(estateId: string | null): Promise<AvailableDelivery[]> {
  try {
    let query = supabase
      .from("premium_deliveries")
      .select(`
        id,
        status,
        created_at,
        premium_orders (
          id,
          delivery_address,
          full_name,
          customer:app_users!premium_orders_customer_id_fkey (
            first_name,
            last_name,
            phone,
            email
          )
        )
      `)
      .eq("status", "pending")
      .is("rider_id", null);

    if (estateId) {
      query = query.or(`estate_id.eq.${estateId},estate_id.is.null`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;

    console.log(`[RiderDeliveries] fetchPremiumDeliveries: ${data?.length ?? 0} pending deliveries found`);

    return data.map(d => {
      const orderData = Array.isArray(d.premium_orders) ? d.premium_orders[0] : d.premium_orders;
      return {
        id: d.id,
        status: d.status,
        created_at: d.created_at,
        type: 'premium',
        order: {
          ...orderData,
          customer: Array.isArray(orderData.customer) ? orderData.customer[0] : orderData.customer,
        }
      };
    }) || [];
  } catch (error) {
    console.error("Error fetching premium deliveries:", error);
    throw error;
  }
}

export async function fetchAvailableDeliveries(): Promise<AvailableDelivery[]> {
  const riderProfile = await getRiderProfile();
  const estateId = riderProfile.estate_id || null;

  if (!estateId) {
    console.warn("[RiderDeliveries] Rider has no estate_id — showing all pending deliveries.");
  }

  const [normalDeliveries, premiumDeliveries, trashDeliveries] = await Promise.all([
    fetchNormalDeliveries(estateId),
    fetchPremiumDeliveries(estateId),
    fetchAvailableTrashDeliveries(estateId || ''),
  ]);

  const allDeliveries = [...normalDeliveries, ...premiumDeliveries, ...trashDeliveries];
  allDeliveries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  console.log(`[RiderDeliveries] Total available deliveries: ${allDeliveries.length}`);
  return allDeliveries;
}

async function fetchActiveNormalDeliveries(riderProfileId: string): Promise<ActiveDelivery[]> {
  const { data, error } = await supabase
    .from("deliveries")
    .select(`
      id,
      status,
      created_at,
      orders (
        id,
        order_number,
        status,
        total_amount,
        delivery_address,
        customer_notes,
        created_at,
        full_name,
        payment_method,
        payment_status,
        customer:app_users!orders_customer_id_fkey (
          first_name,
          last_name,
          phone,
          email
        ),
        order_items (
          product_name,
          quantity
        ),
        vendor:vendor_profiles (
          business_name,
          business_phone
        )
      )
    `)
    .eq("rider_id", riderProfileId)
    .in("status", ["assigned", "picked"]);

  if (error) throw error;
  
  return data.map(d => {
    const orderData = Array.isArray(d.orders) ? d.orders[0] : d.orders;
    return {
      id: d.id,
      status: d.status,
      created_at: d.created_at,
      type: 'normal',
      order: {
        ...orderData,
        customer: Array.isArray(orderData.customer) ? orderData.customer[0] : orderData.customer,
        vendor: Array.isArray(orderData.vendor) ? orderData.vendor[0] : orderData.vendor,
      }
    };
  }) || [];
}

async function fetchActivePremiumDeliveries(riderProfileId: string): Promise<ActiveDelivery[]> {
  const { data, error } = await supabase
    .from("premium_deliveries")
    .select(`
      id,
      status,
      created_at,
      premium_orders (
        id,
        status,
        total_amount,
        delivery_address,
        customer_notes,
        created_at,
        full_name,
        customer:app_users!premium_orders_customer_id_fkey (
          first_name,
          last_name,
          phone,
          email
        ),
        premium_order_items (
          product_name,
          quantity
        )
      )
    `)
    .eq("rider_id", riderProfileId)
    .in("status", ["assigned", "shopping", "purchased", "transit"]);

  if (error) throw error;

  return data.map(d => {
    const orderData = Array.isArray(d.premium_orders) ? d.premium_orders[0] : d.premium_orders;
    return {
      id: d.id,
      status: d.status,
      created_at: d.created_at,
      type: 'premium',
      order: {
        ...orderData,
        order_items: orderData.premium_order_items,
        customer: Array.isArray(orderData.customer) ? orderData.customer[0] : orderData.customer,
      }
    };
  }) || [];
}

export async function fetchActiveDeliveries(riderProfileId: string): Promise<ActiveDelivery[]> {
  const [normalDeliveries, premiumDeliveries, trashDeliveries] = await Promise.all([
    fetchActiveNormalDeliveries(riderProfileId),
    fetchActivePremiumDeliveries(riderProfileId),
    fetchActiveTrashDeliveries(riderProfileId),
  ]);

  const allDeliveries = [...normalDeliveries, ...premiumDeliveries, ...trashDeliveries];

  allDeliveries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allDeliveries;
}

export async function acceptDelivery(deliveryId: string, type: 'normal' | 'premium' | 'trash'): Promise<void> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { data: riderProfile, error: riderErr } = await supabase
    .from("rider_profiles")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (riderErr || !riderProfile) throw new Error("Rider profile not found");

  const tableName = type === 'normal' ? 'deliveries' : type === 'premium' ? 'premium_deliveries' : 'trash_deliveries';

  const { error: updateErr } = await supabase
    .from(tableName)
    .update({
      rider_id: riderProfile.id,
      status: "assigned"
    })
    .eq("id", deliveryId);

  if (updateErr) throw updateErr;
}

export async function updateDeliveryStatus(deliveryId: string, nextStatus: string, type: 'normal' | 'premium' | 'trash'): Promise<void> {
  const tableName = type === 'normal' ? 'deliveries' : type === 'premium' ? 'premium_deliveries' : 'trash_deliveries';
  
  const updateData: Record<string, unknown> = { status: nextStatus };
  
  // Add timestamps for trash deliveries
  if (type === 'trash') {
    if (nextStatus === 'picked_up') {
      updateData.pickup_time = new Date().toISOString();
    } else if (nextStatus === 'completed') {
      updateData.completion_time = new Date().toISOString();
    }
  }
  
  const { error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq("id", deliveryId);

  if (error) throw error;
}

export async function getRiderProfileId(): Promise<string> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { data: riderProfile, error: riderErr } = await supabase
    .from("rider_profiles")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (riderErr || !riderProfile) throw new Error("Rider profile not found");
  return riderProfile.id;
}
