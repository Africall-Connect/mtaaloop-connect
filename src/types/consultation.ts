// Pharmacy Consultation System Types

export type ConsultationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type ConsultationPaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type ConsultationAgeGroup = 'infant' | 'child' | 'teen' | 'adult' | 'senior';

export interface ConsultationType {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultationAvailability {
  id: string;
  vendor_id: string;
  day_of_week: number; // 0-6, Sunday = 0
  start_time: string; // HH:MM
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface ConsultationSlot {
  id: string;
  vendor_id: string;
  consultation_type_id: string | null;
  slot_date: string; // YYYY-MM-DD
  slot_start: string; // HH:MM
  slot_end: string;
  is_available: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface ConsultationBooking {
  id: string;
  slot_id: string | null;
  customer_id: string;
  vendor_id: string;
  consultation_type_id: string;
  status: ConsultationStatus;
  amount: number;
  payment_status: ConsultationPaymentStatus;
  customer_notes: string | null;
  pharmacist_notes: string | null;
  booking_date: string;
  booking_time: string;
  created_at: string;
  updated_at: string;
  // Joined data
  consultation_type?: ConsultationType;
  vendor?: {
    id: string;
    business_name: string;
    logo_url: string | null;
    business_address: string;
  };
  pre_info?: ConsultationPreInfo;
}

export interface ConsultationPreInfo {
  id: string;
  booking_id: string;
  symptoms: string;
  symptom_duration: string;
  has_allergies: boolean;
  allergies_details: string | null;
  has_chronic_conditions: boolean;
  chronic_conditions: string[] | null;
  current_medications: string | null;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  age_group: ConsultationAgeGroup;
  additional_notes: string | null;
  created_at: string;
}

// Form input types
export interface ConsultationTypeFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  requires_prescription: boolean;
  is_active: boolean;
}

export interface AvailabilityFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface PreConsultationFormData {
  symptoms: string;
  symptom_duration: string;
  has_allergies: boolean;
  allergies_details?: string;
  has_chronic_conditions: boolean;
  chronic_conditions?: string[];
  current_medications?: string;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  age_group: ConsultationAgeGroup;
  additional_notes?: string;
}

// Constants
export const CHRONIC_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Arthritis',
  'Thyroid Disorder',
  'Kidney Disease',
  'Liver Disease',
  'Cancer',
  'HIV/AIDS',
  'Epilepsy',
  'Other'
] as const;

export const SYMPTOM_DURATIONS = [
  { value: 'today', label: 'Started today' },
  { value: '1-3_days', label: '1-3 days' },
  { value: '4-7_days', label: '4-7 days' },
  { value: '1-2_weeks', label: '1-2 weeks' },
  { value: '2-4_weeks', label: '2-4 weeks' },
  { value: 'over_1_month', label: 'Over 1 month' },
  { value: 'chronic', label: 'Chronic/Recurring' },
] as const;

export const AGE_GROUPS = [
  { value: 'infant', label: 'Infant (0-2 years)' },
  { value: 'child', label: 'Child (3-12 years)' },
  { value: 'teen', label: 'Teen (13-17 years)' },
  { value: 'adult', label: 'Adult (18-64 years)' },
  { value: 'senior', label: 'Senior (65+ years)' },
] as const;

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  no_show: { label: 'No Show', color: 'bg-red-100 text-red-800' },
};
