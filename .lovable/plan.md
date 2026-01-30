
# Implementation Plan

## Overview

This plan addresses three issues:
1. Landing page header cleanup - replace cart/account with Login button
2. Account page redesign with themed UI and faster loading  
3. Fix order cancellation error caused by invalid payment_status value

---

## Issue 1: Landing Page Header

### Problem
The Index.tsx landing page has cart and account icons in the header, but since this is the public landing page (for non-logged-in users), these don't make sense.

### Solution
Replace the cart and account buttons with a single "Log In" button positioned on the right side of the header.

### Changes to Index.tsx

**Mobile header (lines 363-383):**
- Remove ShoppingBag button
- Remove User button  
- Add single "Log In" button

**Desktop header (lines 411-429):**
- Remove ShoppingBag button
- Remove Account button
- Add single "Log In" button with LogIn icon

```text
Before:
[Logo] [Search...............] [Cart] [Account]

After:
[Logo] [Search...............] [Log In]
```

---

## Issue 2: Account.tsx Redesign

### Problems
1. Plain white background - doesn't match MtaaLoop's vibrant theme
2. Customer info takes time to load with no visual feedback
3. Layout is basic and not visually engaging

### Solution

**Theme Improvements:**
- Add gradient background matching Home.tsx theme
- Use Card components with subtle shadows and hover effects
- Add decorative elements (gradient overlays, icons)
- Use brand colors for highlights

**Loading Optimization:**
- Add skeleton loaders for each data section
- Show partial data as it loads (email available immediately from auth)
- Separate quick-loading data from slower queries

**Layout Enhancements:**

```text
+----------------------------------------------------------+
|  [Back]                     Account                       |
+----------------------------------------------------------+
|  [Gradient Hero Banner with Avatar]                       |
|  +------------------+                                     |
|  |  [Avatar/Initial]|  Name (with skeleton if loading)   |
|  |                  |  email@example.com                  |
|  +------------------+  Member since: Jan 2024             |
+----------------------------------------------------------+
|  +------------+  +------------+                           |
|  | Orders     |  | Member     |                           |
|  | [count]    |  | Since      |                           |
|  +------------+  +------------+                           |
+----------------------------------------------------------+
|  Quick Links                                              |
|  [Icon] My Orders                    >                    |
|  [Icon] Payment Methods              >                    |
|  [Icon] Wallet & Points              >                    |
|  [Icon] Refer Friends                >                    |
|  [Icon] Settings                     >                    |
|  [Icon] Help & Support               >                    |
|  [Icon] Inbox                        >                    |
|  [Icon] Live Support                 >                    |
+----------------------------------------------------------+
|  [Logout Button - Red accent]                             |
+----------------------------------------------------------+
```

**Code Structure:**
```typescript
// Skeleton state for loading
{loading ? (
  <div className="space-y-4">
    <Skeleton className="h-20 w-20 rounded-full" />
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-32" />
  </div>
) : (
  <div>
    {/* Actual profile content */}
  </div>
)}
```

---

## Issue 3: Order Cancellation Error

### Problem
The database constraint `orders_payment_status_chk` only allows:
- `'pending'`
- `'paid'`
- `'failed'`
- `'refunded'`

But the code in OrderTracking.tsx tries to set `payment_status: 'cancelled'` which violates the constraint.

### Solution

When cancelling an order, instead of setting `payment_status` to `'cancelled'`, we should:
1. Keep `payment_status` unchanged OR set it to `'refunded'` if payment was made
2. Only update the `status` field to `'cancelled'`

**Fix in OrderTracking.tsx (lines 807-815):**

```typescript
// Before (WRONG):
const { error: orderError } = await supabase
  .from("orders")
  .update({
    status: "cancelled",
    payment_status: "cancelled",  // <-- This violates the constraint
    cancellation_reason: cancelReason,
    cancelled_at: new Date().toISOString(),
  })
  .eq("id", orderId);

// After (CORRECT):
const newPaymentStatus = orderData?.payment_status === 'paid' ? 'refunded' : orderData?.payment_status;

const { error: orderError } = await supabase
  .from("orders")
  .update({
    status: "cancelled",
    payment_status: newPaymentStatus,  // <-- Keep existing or set to 'refunded' if paid
    cancellation_reason: cancelReason,
    cancelled_at: new Date().toISOString(),
  })
  .eq("id", orderId);
```

This logic:
- If payment was `'paid'`, change to `'refunded'` (indicating refund needed)
- If payment was `'pending'` or `'failed'`, keep the same value
- Never set to `'cancelled'` which isn't allowed

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Replace cart/account with Log In button |
| `src/pages/Account.tsx` | Full redesign with theme + skeleton loaders |
| `src/pages/OrderTracking.tsx` | Fix payment_status update logic |

---

## Technical Details

### Index.tsx Header Changes

Mobile layout (lines 356-394):
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <img src="/logo.png" alt="Mtaaloop" className="h-8 w-8" />
    <span className="font-bold text-lg text-primary">Mtaaloop</span>
  </div>
  <Button
    variant="outline"
    size="sm"
    onClick={() => navigate("/auth/login")}
  >
    <LogIn className="h-4 w-4 mr-2" />
    Log In
  </Button>
</div>
```

Desktop layout (lines 396-431):
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" onClick={() => navigate("/auth/login")}>
    <LogIn className="h-4 w-4 mr-2" />
    Log In
  </Button>
</div>
```

### Account.tsx Theme Implementation

Background gradient:
```tsx
<div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
```

Hero section with gradient overlay:
```tsx
<div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-blue-500/20 rounded-2xl p-6 mb-6 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
  {/* Avatar and info */}
</div>
```

Stats cards with themed borders:
```tsx
<Card className="p-4 bg-card/80 backdrop-blur border-primary/10 hover:border-primary/30 transition-colors">
```

Quick links with hover effects:
```tsx
<Card className="p-4 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer group">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <span className="font-medium">{label}</span>
    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
  </div>
</Card>
```

---

## Mobile Responsiveness

All changes maintain:
- Minimum 44px touch targets
- Proper spacing on smaller screens
- Readable text at all breakpoints
- Skeleton loaders that match content size
