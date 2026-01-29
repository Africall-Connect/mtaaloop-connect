// Subscription Types for MtaaLoop Plus

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: SubscriptionFeatures;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface SubscriptionFeatures {
  deliveries: number | null; // null = unlimited
  trash: number | null;
  osha_viombo: number | null;
  cleaning: number | null;
  laundry: number | null;
  meal_prep: number | null;
  errands: number | null;
  cashback_percent: number;
  priority_support: boolean;
  agent_scheduling: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan?: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  id: string;
  subscription_id?: string;
  user_id: string;
  usage_type: UsageType;
  period_month: string; // '2026-01' format
  limit_amount: number | null;
  used_amount: number;
}

export type UsageType = 
  | 'delivery' 
  | 'trash' 
  | 'osha_viombo' 
  | 'cleaning' 
  | 'laundry' 
  | 'meal_prep' 
  | 'errand'
  | 'package_collection';

export interface UsageStatus {
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | 'unlimited';
  percentUsed: number;
}

export interface SubscriptionBenefits {
  cashbackPercent: number;
  freeDelivery: boolean;
  prioritySupport: boolean;
  agentScheduling: boolean;
}

export interface SubscriptionState {
  isSubscribed: boolean;
  plan: SubscriptionPlan | null;
  subscription: UserSubscription | null;
  usage: Record<UsageType, UsageStatus>;
  benefits: SubscriptionBenefits;
  expiresAt: Date | null;
  loading: boolean;
}

// Micro-Service Types
export interface MicroService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  base_price: number;
  estimated_time: string | null;
  category: 'cleaning' | 'delivery' | 'cooking' | 'errands';
  subscription_key: UsageType;
  is_active: boolean;
  display_order: number;
  requires_scheduling: boolean;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  service_id: string;
  service?: MicroService;
  customer_id: string;
  estate_id?: string;
  agent_id?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  is_subscription_usage: boolean;
  payment_status: 'pending' | 'paid' | 'refunded';
  scheduled_for?: string;
  house_number?: string;
  full_name?: string;
  customer_notes?: string;
  completed_at?: string;
  rating?: number;
  created_at: string;
}

// Subscription Plan Constants
export const SUBSCRIPTION_PLANS: Omit<SubscriptionPlan, 'id' | 'created_at'>[] = [
  {
    name: 'Starter',
    slug: 'starter',
    price: 999,
    billing_period: 'monthly',
    is_active: true,
    display_order: 1,
    features: {
      deliveries: 30,
      trash: 6,
      osha_viombo: 2,
      cleaning: 1,
      laundry: 2,
      meal_prep: null, // Not included
      errands: null, // Not included
      cashback_percent: 2,
      priority_support: false,
      agent_scheduling: false,
    },
  },
  {
    name: 'Essential',
    slug: 'essential',
    price: 1599,
    billing_period: 'monthly',
    is_active: true,
    display_order: 2,
    features: {
      deliveries: 50,
      trash: 12,
      osha_viombo: 4,
      cleaning: 2,
      laundry: 4,
      meal_prep: 1,
      errands: 2,
      cashback_percent: 5,
      priority_support: true,
      agent_scheduling: false,
    },
  },
  {
    name: 'Premium',
    slug: 'premium',
    price: 2499,
    billing_period: 'monthly',
    is_active: true,
    display_order: 3,
    features: {
      deliveries: 80,
      trash: 20,
      osha_viombo: 8,
      cleaning: 4,
      laundry: 8,
      meal_prep: 3,
      errands: 5,
      cashback_percent: 8,
      priority_support: true,
      agent_scheduling: true,
    },
  },
  {
    name: 'Ultimate',
    slug: 'ultimate',
    price: 3599,
    billing_period: 'monthly',
    is_active: true,
    display_order: 4,
    features: {
      deliveries: null, // Unlimited
      trash: null, // Unlimited
      osha_viombo: 15,
      cleaning: 8,
      laundry: 12,
      meal_prep: 6,
      errands: 10,
      cashback_percent: 12,
      priority_support: true,
      agent_scheduling: true,
    },
  },
];

// Micro-Services Catalog
export const MICRO_SERVICES_CATALOG: Omit<MicroService, 'id' | 'created_at'>[] = [
  {
    name: 'Trash Collection',
    slug: 'trash-collection',
    description: 'Quick doorstep trash pickup - our #1 service',
    icon: '🗑️',
    base_price: 30,
    estimated_time: '10 minutes',
    category: 'delivery',
    subscription_key: 'trash',
    is_active: true,
    display_order: 1,
    requires_scheduling: false,
  },
  {
    name: 'Package Collection',
    slug: 'package-collection',
    description: 'Pick up packages from your gate or reception',
    icon: '📦',
    base_price: 20,
    estimated_time: '15 minutes',
    category: 'delivery',
    subscription_key: 'package_collection',
    is_active: true,
    display_order: 2,
    requires_scheduling: false,
  },
  {
    name: 'Osha Viombo',
    slug: 'osha-viombo',
    description: 'Dish washing service (up to 15 items)',
    icon: '🧽',
    base_price: 80,
    estimated_time: '25 minutes',
    category: 'cleaning',
    subscription_key: 'osha_viombo',
    is_active: true,
    display_order: 3,
    requires_scheduling: false,
  },
  {
    name: 'Quick Cleaning',
    slug: 'quick-cleaning',
    description: '30-min bedroom or sitting room tidy-up',
    icon: '🧹',
    base_price: 150,
    estimated_time: '30 minutes',
    category: 'cleaning',
    subscription_key: 'cleaning',
    is_active: true,
    display_order: 4,
    requires_scheduling: true,
  },
  {
    name: 'Laundry Sorting',
    slug: 'laundry-sorting',
    description: 'Sort, fold, and organize your clean clothes',
    icon: '👕',
    base_price: 50,
    estimated_time: '20 minutes',
    category: 'cleaning',
    subscription_key: 'laundry',
    is_active: true,
    display_order: 5,
    requires_scheduling: false,
  },
  {
    name: 'Quick Meal Prep',
    slug: 'quick-meal-prep',
    description: 'Simple meal preparation (ingredients provided by you)',
    icon: '🍳',
    base_price: 200,
    estimated_time: '45 minutes',
    category: 'cooking',
    subscription_key: 'meal_prep',
    is_active: true,
    display_order: 6,
    requires_scheduling: true,
  },
  {
    name: 'Run Errands',
    slug: 'errands',
    description: 'General errands within or outside the estate',
    icon: '🏃',
    base_price: 100,
    estimated_time: 'Varies',
    category: 'errands',
    subscription_key: 'errand',
    is_active: true,
    display_order: 7,
    requires_scheduling: false,
  },
];
