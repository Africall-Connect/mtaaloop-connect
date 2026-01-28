export interface RiderLocation {
  id: string;
  order_id: string;
  rider_id: string;
  lat: number;
  lng: number;
  timestamp: number;
  created_at: string;
}

export interface DeliveryStatus {
  id: string;
  order_id: string;
  rider_id: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assigned_at: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  delivery_fee: number;
  created_at: string;
  updated_at: string;
}
