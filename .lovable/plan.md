

# Fix Remaining TypeScript Errors

## Overview

This plan addresses TypeScript errors across multiple files related to:
1. **Block-scoped variable used before declaration** - `useCallback` functions must be defined before they're referenced in `useEffect` dependency arrays
2. **Unknown type issues** - Variables typed as `unknown` need proper type assertions or interface definitions
3. **Missing properties on interfaces** - Type definitions need to be updated to include all used properties
4. **Type comparison issues** - Operational category type doesn't include 'pharmacy' in some interfaces

---

## Error Categories

| Category | Files Affected | Count |
|----------|----------------|-------|
| Block-scoped variable before declaration | 11 files | ~30 errors |
| Unknown type issues | 5 files | ~25 errors |
| Missing interface properties | 3 files | ~10 errors |
| Type comparison | 1 file | 1 error |

---

## Detailed Changes

### 1. OrderTracking.tsx (Lines 409-416, 970-986)

**Problem**: `order` parameter typed as `Record<string, unknown>` causes type errors when accessing properties.

**Fix**: Cast/assert types properly when accessing order properties.

```typescript
// Line 409: Change parameter type
const loadExistingOrder = async (order: OrderData) => {
  console.log("[loadExistingOrder] order =", order);
  setOrderData({
    ...order,
    items: order.order_items ?? [],
  });
  setOrderStatus(order.status);
  updateProgressFromStatus(order.status);
  // ...
};

// Lines 970-986: Cast reviewData properties to numbers
{"⭐".repeat(Number(reviewData.food_rating) || 0)}
{"☆".repeat(5 - (Number(reviewData.food_rating) || 0))}
// Same for delivery_rating
// And for comment: String(reviewData.comment) or reviewData.comment as string
```

---

### 2. Estate Pages - Fix useCallback Order

**Files**: 
- `EstateDashboard.tsx`
- `Notifications.tsx`
- `Analytics.tsx`

**Problem**: `useEffect` references `useCallback` functions before they're declared.

**Fix**: Move all `useCallback` definitions BEFORE any `useEffect` that references them.

**Pattern to apply**:
```typescript
// WRONG ORDER (causes error):
useEffect(() => {
  fetchData();
}, [fetchData]); // Error: used before declaration

const fetchData = useCallback(() => { ... }, []);

// CORRECT ORDER:
const fetchData = useCallback(() => { ... }, []);

useEffect(() => {
  fetchData();
}, [fetchData]); // Works!
```

**EstateDashboard.tsx changes**:
1. Move `fetchStats` before line 50
2. Move `fetchEstateData` before line 50
3. Move `setupRealtimeSubscriptions` before line 59

**Notifications.tsx changes**:
1. Move `fetchNotifications` before line 28
2. Move `setupRealtimeSubscription` before line 28

---

### 3. Rider Pages - Fix useCallback Order

**Files**:
- `RiderAnalytics.tsx`
- `RiderCommunications.tsx`
- `RiderCustomerManagement.tsx`
- `RiderDashboard.tsx`

**RiderAnalytics.tsx**: Move `fetchInsightsData` before line 19

**RiderCommunications.tsx**: 
1. Move `fetchConversations` before line 51
2. Move `setupRealtimeSubscription` before line 51
3. Move `fetchMessages` before line 58

**RiderCustomerManagement.tsx**:
1. Move `fetchCustomers` before line 40
2. Add proper typing for `customerMap`:
```typescript
interface CustomerStats {
  id: string;
  orderCount: number;
  totalSpent: number;
  orders: Array<{ created_at: string; [key: string]: unknown }>;
}
const customerMap = new Map<string, CustomerStats>();
```

**RiderDashboard.tsx** (Lines 472-480, 649-664):
Add missing properties to `Delivery` interface or use type assertion:
```typescript
interface Delivery {
  // existing properties...
  vendor_name?: string;
  pickup_address?: string;
  delivery_address?: string;
}
```

---

### 4. Vendor Pages - Fix useCallback Order

**Files**:
- `AdvancedOrdersManagement.tsx`
- `AnalyticsDashboard.tsx`
- `CommunicationsHub.tsx`
- `MarketingCampaigns.tsx`
- `MinimartAnalytics.tsx`
- `MinimartManagement.tsx`

**All files**: Move `useCallback` definitions before `useEffect` that reference them.

**AdvancedOrdersManagement.tsx** (Line 154):
Fix the `setOrders` call to properly type the mapped data:
```typescript
setOrders(
  (data || []).map((order: Record<string, unknown>): Order => ({
    id: order.id as string,
    order_number: order.order_number as string | null,
    status: order.status as string,
    total_amount: order.total_amount as number,
    delivery_address: order.delivery_address as string,
    customer_notes: order.customer_notes as string | null,
    payment_status: order.payment_status as string,
    created_at: order.created_at as string,
    estate_id: order.estate_id as string | null,
    order_items: order.order_items as OrderItem[],
    deliveries: (order.deliveries as Record<string, unknown>[])?.map(...),
  }))
);
```

**Line 235 dateFilter issue**: Change state type to accept string:
```typescript
const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
// Or use string type with validation
```

---

### 5. Analytics Pages - TopProduct Interface

**Files**:
- `AnalyticsDashboard.tsx`
- `MinimartAnalytics.tsx`

**Problem**: `TopProduct` interface missing `id`, `image_url`, `price`, `total_quantity` properties.

**Fix**: Update the interface:
```typescript
interface TopProduct {
  id?: string;
  name: string;
  revenue: number;
  orders: number;
  // Add missing properties
  image_url?: string;
  price?: number;
  total_quantity?: number;
}
```

---

### 6. Estate/Analytics.tsx - Unknown Type Issues

**Lines 169-171, 399-406**: Type assertions needed for fetched data.

```typescript
// Lines 169-171: Cast the arrays properly
setAnalytics({
  // ...
  topVendors: topVendors as TopVendor[],
  revenueByCategory: revenueByCategory as RevenueByCategory[],
  // ...
});

// Lines 399-406: Add proper typing for recentOrders map
interface RecentOrder {
  id: string;
  created_at: string;
  vendor?: { business_name: string };
  resident?: { apartment_number: string };
  final_amount?: number;
  status: string;
}

// Update analytics state type
recentOrders: RecentOrder[];
```

---

### 7. NewVendorDashboard.tsx - Pharmacy Type

**Line 270**: The `operational_category` type doesn't include 'pharmacy'.

**Fix**: Update the `VendorProfile` interface:
```typescript
interface VendorProfile {
  // ...
  operational_category: 'inventory' | 'service' | 'booking' | 'minimart' | 'pharmacy' | null;
  // ...
}
```

---

### 8. Estate/Notifications.tsx - Metadata Type

**Lines 265-267**: `notification.metadata` typed as `unknown`.

**Fix**: Add proper typing:
```typescript
interface Notification {
  // existing...
  metadata?: {
    amount?: number;
    [key: string]: unknown;
  };
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OrderTracking.tsx` | Fix parameter types and type assertions |
| `src/pages/estate/Analytics.tsx` | Fix unknown types, add RecentOrder interface |
| `src/pages/estate/EstateDashboard.tsx` | Reorder useCallback/useEffect |
| `src/pages/estate/Notifications.tsx` | Reorder useCallback/useEffect, fix metadata type |
| `src/pages/rider/RiderAnalytics.tsx` | Reorder useCallback/useEffect |
| `src/pages/rider/RiderCommunications.tsx` | Reorder useCallback/useEffect |
| `src/pages/rider/RiderCustomerManagement.tsx` | Reorder + add CustomerStats interface |
| `src/pages/rider/RiderDashboard.tsx` | Add Delivery interface properties |
| `src/pages/vendor/AdvancedOrdersManagement.tsx` | Reorder + fix Order mapping + dateFilter type |
| `src/pages/vendor/AnalyticsDashboard.tsx` | Reorder + update TopProduct interface |
| `src/pages/vendor/CommunicationsHub.tsx` | Reorder useCallback/useEffect |
| `src/pages/vendor/MarketingCampaigns.tsx` | Reorder useCallback/useEffect |
| `src/pages/vendor/MinimartAnalytics.tsx` | Reorder + update TopProduct interface |
| `src/pages/vendor/MinimartManagement.tsx` | Reorder useCallback/useEffect |
| `src/pages/vendor/NewVendorDashboard.tsx` | Add 'pharmacy' to operational_category type |

---

## Summary

This plan fixes approximately 60+ TypeScript errors by:

1. **Reordering code** - Moving `useCallback` definitions before `useEffect` hooks (most common fix)
2. **Adding type assertions** - Properly typing `unknown` values from database queries
3. **Extending interfaces** - Adding missing properties to type definitions
4. **Fixing type unions** - Including 'pharmacy' in operational category types

All changes maintain existing functionality while ensuring type safety.

