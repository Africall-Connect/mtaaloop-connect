import { supabase } from '../integrations/supabase/client';

export interface AvailableTrashDelivery {
  id: string;
  status: string;
  created_at: string;
  type: 'trash';
  order: {
    id: string;
    house: string;
    full_name: string;
    customer_notes: string | null;
    amount: number;
    customer: {
      first_name: string | null;
      last_name: string | null;
      phone: string;
      email: string;
    };
  };
}

export interface ActiveTrashDelivery {
  id: string;
  status: string;
  created_at: string;
  type: 'trash';
  order: {
    id: string;
    house: string;
    full_name: string;
    customer_notes: string | null;
    amount: number;
    status: string;
    created_at: string;
    customer: {
      first_name: string | null;
      last_name: string | null;
      phone: string;
      email: string;
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

export async function fetchAvailableTrashDeliveries(estateId: string): Promise<AvailableTrashDelivery[]> {
  try {
    const { data, error } = await supabase
      .from("trash_deliveries")
      .select(`
        id,
        status,
        created_at,
        trash_collection_id,
        trash_collection:trash_collection_id (
          id,
          house,
          full_name,
          customer_notes,
          amount,
          customer_id
        )
      `)
      .eq("status", "pending")
      .is("rider_id", null)
      .eq('estate_id', estateId);

    if (error) {
      console.error("Error fetching trash deliveries:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }
    
    // Fetch customer details separately
    const deliveriesWithCustomers = await Promise.all(
      data.map(async (d) => {
        const orderData = Array.isArray(d.trash_collection) ? d.trash_collection[0] : d.trash_collection;
        
        if (!orderData) {
          console.error("No trash_collection data for delivery:", d.id);
          return null;
        }
        
        const { data: customer, error: customerError } = await supabase
          .from('app_users')
          .select('first_name, last_name, phone, email')
          .eq('id', orderData.customer_id)
          .single();

        if (customerError) {
          console.error("Error fetching customer:", customerError);
        }

        return {
          id: d.id,
          status: d.status,
          created_at: d.created_at,
          type: 'trash' as const,
          order: {
            id: orderData.id,
            house: orderData.house,
            full_name: orderData.full_name,
            customer_notes: orderData.customer_notes,
            amount: orderData.amount,
            customer: customer || {
              first_name: null,
              last_name: null,
              phone: '',
              email: ''
            }
          }
        };
      })
    );

    return deliveriesWithCustomers.filter(d => d !== null) as AvailableTrashDelivery[];
  } catch (error) {
    console.error("Error fetching trash deliveries:", error);
    return [];
  }
}

export async function fetchActiveTrashDeliveries(riderProfileId: string): Promise<ActiveTrashDelivery[]> {
  try {
    const { data, error } = await supabase
      .from("trash_deliveries")
      .select(`
        id,
        status,
        created_at,
        trash_collection_id,
        trash_collection:trash_collection_id (
          id,
          house,
          full_name,
          customer_notes,
          amount,
          status,
          created_at,
          customer_id
        )
      `)
      .eq("rider_id", riderProfileId)
      .in("status", ["assigned", "picked_up"]);

    if (error) {
      console.error("Error fetching active trash deliveries:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }
    
    // Fetch customer details separately
    const deliveriesWithCustomers = await Promise.all(
      data.map(async (d) => {
        const orderData = Array.isArray(d.trash_collection) ? d.trash_collection[0] : d.trash_collection;
        
        if (!orderData) {
          console.error("No trash_collection data for delivery:", d.id);
          return null;
        }
        
        const { data: customer, error: customerError } = await supabase
          .from('app_users')
          .select('first_name, last_name, phone, email')
          .eq('id', orderData.customer_id)
          .single();

        if (customerError) {
          console.error("Error fetching customer:", customerError);
        }

        return {
          id: d.id,
          status: d.status,
          created_at: d.created_at,
          type: 'trash' as const,
          order: {
            id: orderData.id,
            house: orderData.house,
            full_name: orderData.full_name,
            customer_notes: orderData.customer_notes,
            amount: orderData.amount,
            status: orderData.status,
            created_at: orderData.created_at,
            customer: customer || {
              first_name: null,
              last_name: null,
              phone: '',
              email: ''
            }
          }
        };
      })
    );

    return deliveriesWithCustomers.filter(d => d !== null) as ActiveTrashDelivery[];
  } catch (error) {
    console.error("Error fetching active trash deliveries:", error);
    return [];
  }
}

export async function acceptTrashDelivery(deliveryId: string): Promise<void> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not authenticated");

  const { data: riderProfile, error: riderErr } = await supabase
    .from("rider_profiles")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (riderErr || !riderProfile) throw new Error("Rider profile not found");

  const { error: updateErr } = await supabase
    .from('trash_deliveries')
    .update({
      rider_id: riderProfile.id,
      status: "assigned"
    })
    .eq("id", deliveryId);

  if (updateErr) throw updateErr;
}

export async function updateTrashDeliveryStatus(deliveryId: string, nextStatus: string): Promise<void> {
  const updateData: Record<string, unknown> = { status: nextStatus };
  
  if (nextStatus === 'picked_up') {
    updateData.pickup_time = new Date().toISOString();
  } else if (nextStatus === 'completed') {
    updateData.completion_time = new Date().toISOString();
  }

  const { error } = await supabase
    .from('trash_deliveries')
    .update(updateData)
    .eq("id", deliveryId);

  if (error) throw error;
}
