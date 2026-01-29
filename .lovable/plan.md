

# MtaaLoop Plus Subscription & Micro-Services Implementation Plan

## Executive Summary

This plan implements a comprehensive subscription system with 4 tiers (KSh 999 - KSh 3,599), integrates micro-services for young urban residents, updates terminology from "Rider" to "Delivery Agent", and implements dynamic delivery fee calculation with multi-vendor surcharges.

---

## Major Components

| Component | Description | Priority |
|-----------|-------------|----------|
| Subscription Tiers | 4 plans from KSh 999 to KSh 3,599/month | High |
| Micro-Services | Trash, Cleaning, Laundry, Cooking, Errands | High |
| Terminology Update | "Rider" → "Delivery Agent" globally | Medium |
| Delivery Fee Logic | Within building (KSh 40) vs Outside (KSh 100) | High |
| Multi-Vendor Surcharge | Progressive surcharge for large orders | Medium |

---

## Part 1: Subscription Tier Structure

### Tier Breakdown

```text
┌─────────────────┬────────────┬─────────────┬──────────────┬──────────────┐
│ Feature         │ Starter    │ Essential   │ Premium      │ Ultimate     │
│                 │ KSh 999    │ KSh 1,599   │ KSh 2,499    │ KSh 3,599    │
├─────────────────┼────────────┼─────────────┼──────────────┼──────────────┤
│ Deliveries      │ 30/month   │ 50/month    │ 80/month     │ Unlimited    │
│ Trash Pickups   │ 6/month    │ 12/month    │ 20/month     │ Unlimited    │
│ Cashback        │ 2%         │ 5%          │ 8%           │ 12%          │
│ Osha Viombo     │ 2/month    │ 4/month     │ 8/month      │ 15/month     │
│ Quick Cleaning  │ 1/month    │ 2/month     │ 4/month      │ 8/month      │
│ Laundry Sort    │ 2/month    │ 4/month     │ 8/month      │ 12/month     │
│ Quick Meal Prep │ ❌         │ 1/month     │ 3/month      │ 6/month      │
│ Errands         │ ❌         │ 2/month     │ 5/month      │ 10/month     │
│ Priority Support│ ❌         │ ✅          │ ✅           │ ✅           │
│ Agent Scheduling│ ❌         │ ❌          │ ✅           │ ✅           │
└─────────────────┴────────────┴─────────────┴──────────────┴──────────────┘
```

### Database Schema

**Migration: `supabase/migrations/XXXXX_subscription_system.sql`**

```sql
-- Subscription Plans
CREATE TABLE public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,                      -- "Starter", "Essential", "Premium", "Ultimate"
    slug text UNIQUE NOT NULL,
    price decimal(10,2) NOT NULL,            -- 999, 1599, 2499, 3599
    billing_period text DEFAULT 'monthly',
    features jsonb NOT NULL DEFAULT '{}',    -- Detailed feature allowances
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- User Subscriptions
CREATE TABLE public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    payment_reference text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Usage Tracking per Service Type
CREATE TABLE public.subscription_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    usage_type text NOT NULL,  -- 'delivery', 'trash', 'osha_viombo', 'cleaning', 'laundry', 'meal_prep', 'errand'
    period_month text NOT NULL,  -- '2026-01' format
    limit_amount integer,
    used_amount integer DEFAULT 0,
    UNIQUE(user_id, usage_type, period_month)
);
```

---

## Part 2: Micro-Services Catalog

### Services for Young Urban Residents

| Service | Price (Non-Subscriber) | Description |
|---------|------------------------|-------------|
| 🗑️ Trash Collection | KSh 30 | Doorstep pickup, #1 priority service |
| 🧽 Osha Viombo | KSh 80 | Dish washing (up to 15 items) |
| 🧹 Quick Cleaning | KSh 150 | 30-min bedroom/sitting room tidy |
| 👕 Laundry Sort | KSh 50 | Sort, fold, organize clean clothes |
| 🍳 Quick Meal Prep | KSh 200 | Simple meal prep (ingredients provided) |
| 📦 Package Collection | KSh 20 | Pick up package from gate |
| 🏃 Errands | KSh 100+ | General errands within estate |

### Database Schema

**Add to migration:**

```sql
-- Micro-Services Catalog
CREATE TABLE public.micro_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    icon text,
    base_price decimal(10,2) NOT NULL,
    estimated_time text,
    category text,                  -- 'cleaning', 'delivery', 'cooking', 'errands'
    subscription_key text NOT NULL, -- matches subscription_usage.usage_type
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    requires_scheduling boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Service Requests (generic for all micro-services)
CREATE TABLE public.service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES micro_services(id) NOT NULL,
    customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    estate_id uuid REFERENCES estates(id),
    agent_id uuid REFERENCES auth.users(id),     -- Delivery Agent assigned
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    amount decimal(10,2) NOT NULL,
    is_subscription_usage boolean DEFAULT false,  -- Did they use sub quota?
    payment_status text DEFAULT 'pending',
    scheduled_for timestamptz,
    house_number text,
    full_name text,
    customer_notes text,
    completed_at timestamptz,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    created_at timestamptz DEFAULT now()
);
```

---

## Part 3: Terminology Update - "Rider" → "Delivery Agent"

### Files Requiring Changes

Based on the search, 43 files contain "rider" terminology. Key files to update:

| File Category | Files | Changes Required |
|---------------|-------|------------------|
| Rider Pages | 12 files in `src/pages/rider/` | Rename to `agent/`, update all UI text |
| Database Tables | `rider_profiles`, `rider_notifications` | Keep table names, update column comments only |
| UI Components | OrderTracking, Checkout, etc. | Update display text only |
| Stores | `riderStore.ts`, `riderStatusStore.ts` | Rename to agentStore |

### Implementation Strategy

1. **Keep database table names** (avoid migration complexity)
2. **Update ALL user-facing text** to use "Delivery Agent"
3. **Rename page folders** from `rider/` to `agent/`
4. **Update routes** from `/rider/` to `/agent/`
5. **Update store names** from `rider*` to `agent*`

**Key Text Replacements:**

```text
"Rider Found" → "Agent Assigned"
"Call Rider" → "Call Agent"
"Rider is Shopping" → "Agent is Shopping"
"Rider Dashboard" → "Agent Dashboard"
"Become a Rider" → "Become a Delivery Agent"
```

---

## Part 4: Delivery Fee Structure

### Fee Logic

```text
┌─────────────────────────────┬─────────────────┐
│ Delivery Type               │ Fee             │
├─────────────────────────────┼─────────────────┤
│ Within Building (same ID)   │ KSh 40          │
│ Outside Building            │ KSh 100         │
│ Errand Run (agent goes out) │ KSh 100 + costs │
└─────────────────────────────┴─────────────────┘
```

### Multi-Vendor Surcharge

When ordering from multiple vendors with high quantity:

```text
Base: KSh 40-100 (depending on location)

Surcharge Matrix:
┌────────────────────┬──────────────────┐
│ Total Items        │ Extra Charge     │
├────────────────────┼──────────────────┤
│ 1-10 items         │ KSh 0            │
│ 11-20 items        │ +KSh 30          │
│ 21-30 items        │ +KSh 50          │
│ 31+ items          │ +KSh 80          │
└────────────────────┴──────────────────┘

Multi-Vendor Premium:
┌────────────────────┬──────────────────┐
│ Vendors            │ Extra Charge     │
├────────────────────┼──────────────────┤
│ 1 vendor           │ KSh 0            │
│ 2 vendors          │ +KSh 20          │
│ 3+ vendors         │ +KSh 40          │
└────────────────────┴──────────────────┘
```

### Implementation in CartContext

```typescript
// Update CartContext.tsx
const calculateDeliveryFee = (items: CartItem[], isWithinBuilding: boolean): number => {
  const baseFee = isWithinBuilding ? 40 : 100;
  
  // Item count surcharge
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  let itemSurcharge = 0;
  if (totalItems > 30) itemSurcharge = 80;
  else if (totalItems > 20) itemSurcharge = 50;
  else if (totalItems > 10) itemSurcharge = 30;
  
  // Multi-vendor surcharge
  const uniqueVendors = new Set(items.map(item => item.vendorId)).size;
  let vendorSurcharge = 0;
  if (uniqueVendors >= 3) vendorSurcharge = 40;
  else if (uniqueVendors === 2) vendorSurcharge = 20;
  
  return baseFee + itemSurcharge + vendorSurcharge;
};
```

---

## Part 5: New Pages & Components

### New Files to Create

```text
src/
├── contexts/
│   └── SubscriptionContext.tsx      # Subscription state management
├── pages/
│   ├── MtaaLoopPlus.tsx             # Subscription landing page
│   ├── QuickServices.tsx            # Micro-services hub
│   ├── services/
│   │   ├── OshaViombo.tsx           # Dish washing service
│   │   ├── QuickCleaning.tsx        # 30-min cleaning
│   │   ├── LaundrySorting.tsx       # Laundry organization
│   │   ├── QuickMealPrep.tsx        # Meal preparation
│   │   └── PackageCollection.tsx    # Gate package pickup
│   └── agent/                        # Renamed from rider/
│       ├── AgentDashboard.tsx
│       ├── AgentEarnings.tsx
│       └── ...
├── components/
│   ├── subscription/
│   │   ├── SubscriptionCard.tsx     # Plan display card
│   │   ├── SubscriptionBadge.tsx    # "Plus" badge indicator
│   │   ├── UsageTracker.tsx         # Monthly usage display
│   │   └── UpgradePrompt.tsx        # Upgrade CTA
│   └── services/
│       ├── ServiceCard.tsx          # Service display
│       └── ServiceRequestForm.tsx   # Generic request form
```

---

## Part 6: Home Page Updates

### Updated Category Grid

```typescript
// In Home.tsx - Reorganize categories
const allCategories = [
  // 🗑️ PRIORITY #1 - Trash Collection moved to top
  {
    icon: Trash2,
    name: "Trash Collection",
    subtitle: "Quick doorstep pickup - KSh 30",
    link: "/trash-collection",
    gradient: "from-emerald-600 to-teal-700",
    isPriority: true
  },
  // ⚡ NEW - Quick Services Hub
  {
    icon: Zap,
    name: "Quick Services",
    subtitle: "Cleaning, Dishes, Laundry & More",
    link: "/quick-services",
    gradient: "from-purple-500 to-pink-500",
    isNew: true
  },
  // ... existing categories
];
```

---

## Part 7: Subscription Context

### `src/contexts/SubscriptionContext.tsx`

```typescript
interface SubscriptionState {
  isSubscribed: boolean;
  plan: SubscriptionPlan | null;
  usage: {
    deliveries: { used: number; limit: number | null };
    trash: { used: number; limit: number | null };
    oshaViombo: { used: number; limit: number | null };
    cleaning: { used: number; limit: number | null };
    laundrySort: { used: number; limit: number | null };
    mealPrep: { used: number; limit: number | null };
    errands: { used: number; limit: number | null };
  };
  benefits: {
    cashbackPercent: number;
    freeDelivery: boolean;
    prioritySupport: boolean;
    agentScheduling: boolean;
  };
  expiresAt: Date | null;
}

// Methods:
// - checkCanUseService(serviceType: string): boolean
// - consumeServiceUsage(serviceType: string): Promise<void>
// - getRemainingUsage(serviceType: string): number | 'unlimited'
// - getEffectivePrice(serviceSlug: string): number
```

---

## Part 8: Checkout Integration

### Modified Checkout Flow

```typescript
// In Checkout.tsx

// 1. Check subscription status
const { isSubscribed, checkCanUseService, benefits } = useSubscription();

// 2. Calculate delivery fee with subscription benefits
const calculateDeliveryFee = () => {
  if (isSubscribed && benefits.freeDelivery) {
    return 0; // Included in subscription
  }
  
  // Apply normal fee logic
  const baseFee = isWithinBuilding ? 40 : 100;
  // ... surcharge logic
  return totalFee;
};

// 3. Apply cashback
const cashbackAmount = isSubscribed 
  ? Math.floor(subtotal * (benefits.cashbackPercent / 100))
  : 0;
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Database migrations for subscriptions and micro-services
- SubscriptionContext.tsx
- Basic subscription plans seeding

### Phase 2: Subscription Pages (Week 1-2)
- MtaaLoopPlus.tsx landing page
- Plan comparison UI
- Payment integration with M-PESA

### Phase 3: Micro-Services (Week 2)
- QuickServices.tsx hub
- Individual service pages (OshaViombo, etc.)
- Service request flow

### Phase 4: Terminology Update (Week 2-3)
- Rename rider → agent in all UI text
- Update routes and folder structure
- Update stores

### Phase 5: Fee Logic (Week 3)
- Update CartContext with new fee calculation
- Multi-vendor surcharge logic
- Subscription benefit application in Checkout

### Phase 6: Integration & Testing (Week 3-4)
- Connect all flows
- Agent dashboard updates for micro-services
- End-to-end testing

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/XXXXX_subscription_system.sql` | All new tables |
| `src/contexts/SubscriptionContext.tsx` | Subscription state |
| `src/pages/MtaaLoopPlus.tsx` | Subscription landing |
| `src/pages/QuickServices.tsx` | Services hub |
| `src/pages/services/OshaViombo.tsx` | Dish washing |
| `src/pages/services/QuickCleaning.tsx` | Cleaning service |
| `src/pages/services/LaundrySorting.tsx` | Laundry sort |
| `src/pages/services/QuickMealPrep.tsx` | Meal prep |
| `src/pages/services/PackageCollection.tsx` | Package pickup |
| `src/components/subscription/SubscriptionCard.tsx` | Plan card |
| `src/components/subscription/UsageTracker.tsx` | Usage display |

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/CartContext.tsx` | Add delivery fee calculation |
| `src/pages/Checkout.tsx` | Subscription integration, new fee logic |
| `src/pages/Home.tsx` | Reorganize categories, add Quick Services |
| `src/pages/TrashCollection.tsx` | Subscription usage check |
| `src/App.tsx` | Add new routes, SubscriptionProvider |
| `src/pages/Wallet.tsx` | Show subscription status |
| All rider pages (12 files) | Rename to agent, update text |

---

## Summary

This implementation transforms MtaaLoop into a comprehensive "Building Economy" platform by:

1. **4-Tier Subscriptions** (KSh 999 - 3,599) with escalating benefits
2. **7 Micro-Services** targeting young urban residents' daily needs
3. **Trash Collection as #1 Priority** - the universal need
4. **"Delivery Agent" branding** - more professional terminology
5. **Smart Delivery Fees** - within building (40), outside (100), with surcharges
6. **Multi-Vendor Logic** - fair surcharges for complex orders

This creates sticky, recurring revenue while solving real problems for the target demographic.

