// Common type definitions used across the application

export interface Estate {
  id: string;
  name: string;
  location: string;
  county?: string;
  description?: string;
  is_active?: boolean;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

export interface EmergencyContact {
  name: string;
  phone: string;
  role: string;
}

export interface MaintenanceSchedule {
  [key: string]: unknown;
}

export interface ServiceData {
  vendor_id?: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  category?: string;
  subcategory?: string;
  is_available?: boolean;
  item_type?: string;
  [key: string]: unknown;
}

export interface ProductData {
  vendor_id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  is_available?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  image_url?: string | null;
  image_storage_path?: string | null;
  [key: string]: unknown;
}

export interface ImageFile {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface DeliveryUpdate {
  status: string;
  location?: string;
  notes?: string;
  estimated_time?: string;
}
