// Database types for products and vendor categories
export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  customizations: Record<string, unknown> | null;
  is_popular: boolean;
  is_new: boolean;
  orders_this_week: number;
  item_type: 'inventory' | 'service' | 'booking' | null;
  created_at: string;
  updated_at: string;
  // Pharmacy-specific fields
  requires_prescription?: boolean;
  // Booking-specific fields
  duration?: number;
}

export interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  business_description: string | null;
  business_phone: string;
  business_email: string | null;
  business_address: string;
  logo_url: string | null;
  banner_url: string | null;
  cover_image_url: string | null;
  slug: string;
  is_approved: boolean;
  is_active: boolean;
  is_open: boolean;
  estate_id: string | null;
  rating: number;
  review_count: number;
  total_orders: number;
  tagline: string | null;
  delivery_time: string | null;
  delivery_fee: number | null;
  open_hours: string | null;
  years_in_business: number | null;
  certifications: Record<string, unknown> | null;
  operational_category: 'inventory' | 'service' | 'booking' | 'pharmacy' | null;
  created_at: string;
  updated_at: string;
}

export interface VendorCategory {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface VendorSubcategory {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface VendorWithProducts extends VendorProfile {
  products?: Product[];
  vendor_categories?: VendorCategory[];
  vendor_subcategories?: VendorSubcategory[];
}

// Address Management Types
export interface Address {
  id: string;
  user_id: string;
  label: string;
  estate_name: string;
  phase_block?: string;
  house_number?: string;
  street_address?: string;
  city: string;
  county?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Time Slot Types
export interface TimeSlot {
  id: string;
  vendor_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  is_available: boolean;
  max_orders: number;
  current_orders: number;
  delivery_fee: number;
}

// Promo Code Types
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order: number;
  maximum_discount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  applicable_vendors?: string[]; // vendor IDs
  applicable_categories?: string[]; // category names
  created_at: string;
}

// Payment Split Types
export interface PaymentSplit {
  id: string;
  method: 'mpesa' | 'wallet' | 'cash' | 'card';
  amount: number;
  phone_number?: string; // for M-PESA
  account_number?: string; // for other methods
}

// Order Types (extended for Phase 3)
export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  customizations?: Record<string, unknown>;
  vendor_id: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  promo_code?: string;
  total: number;
  delivery_address: Address;
  delivery_time_slot?: TimeSlot;
  payment_splits: PaymentSplit[];
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}
