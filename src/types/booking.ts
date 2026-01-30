// Booking System Types - mirrors consultation.ts pattern

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type BookingPaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface BookingServiceType {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  subcategory: string | null;
  requires_address: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingAvailability {
  id: string;
  vendor_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_available: boolean;
  created_at: string;
}

export interface BookingTimeSlot {
  id: string;
  vendor_id: string;
  service_type_id: string | null;
  slot_date: string; // YYYY-MM-DD format
  slot_start: string; // HH:MM format
  slot_end: string; // HH:MM format
  is_available: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface BookingReservation {
  id: string;
  slot_id: string | null;
  customer_id: string;
  vendor_id: string;
  service_type_id: string;
  status: BookingStatus;
  amount: number;
  payment_status: BookingPaymentStatus;
  customer_notes: string | null;
  vendor_notes: string | null;
  booking_date: string; // YYYY-MM-DD format
  booking_time: string; // HH:MM format
  created_at: string;
  updated_at: string;
  // Joined fields
  service_type?: BookingServiceType;
  vendor?: {
    id: string;
    business_name: string;
    logo_url: string | null;
    business_address: string;
  };
  customer?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

// Day names for weekly schedule
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

// Status labels with colors for UI
export const BOOKING_STATUS_LABELS: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200' },
  no_show: { label: 'No Show', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
};

// Payment status labels
export const BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  refunded: { label: 'Refunded', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
};

// Duration options for service types
export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
] as const;
