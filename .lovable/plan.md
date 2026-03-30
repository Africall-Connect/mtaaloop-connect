

# Fix Plan: Vendor, Rider, Admin, and Customer Issues

## Root Cause Analysis

After thorough investigation, here are the identified issues across all four account types:

### 1. Vendor: Cannot Accept Orders
- **RLS Policy Gap**: The `orders` table has vendor SELECT and UPDATE policies that work correctly (via `vendor_profiles.id = orders.vendor_id AND vendor_profiles.user_id = auth.uid()`). However, the vendor `OrdersManagement` component and `ActiveOrdersPanel` both update order status correctly. The likely issue is that **vendor order notifications** aren't creating `deliveries` entries after acceptance, so the order flow stalls after "accepted" status.
- **Missing Delivery Creation**: When a vendor accepts an order and marks it "ready", there's no automatic `deliveries` row created for rider pickup. The `vendors_create_deliveries_safe` policy exists but no code triggers it from the vendor dashboard.
- **`premium_deliveries` INSERT Policy Missing**: Customers can insert `premium_deliveries` during checkout, but there's no INSERT policy for the `premium_deliveries` table for customers -- only UPDATE/SELECT policies exist. This blocks premium/minimart order creation.

### 2. Rider: Cannot Accept Deliveries
- **`premium_deliveries` RLS**: The UPDATE policy checks `rider_id = auth.uid()`, but riders use `rider_profiles.id` (not `auth.uid()`) as `rider_id`. This means riders can never update premium deliveries because their `rider_id` is their profile UUID, not their auth UUID.
- **Same issue on `trash_deliveries`**: UPDATE uses `rider_id = auth.uid()` but the code sets `rider_id` to `riderProfile.id`.
- **`rider_can_claim_pending_delivery` policy**: The WITH CHECK allows setting `rider_id` only if `rider_profiles.id = deliveries.rider_id AND rp.user_id = auth.uid()`. This works correctly.
- **`app_users` view with `security_invoker`**: The previous security hardening set `security_invoker = on` on the `app_users` view. Since `app_users` queries `auth.users`, and authenticated users cannot read `auth.users`, all rider queries that JOIN on `app_users` (for customer info) return NULL/empty data, causing the delivery list to appear empty or break.

### 3. Admin: Multiple Features Malfunctioning
- **`user_roles` self-insert vulnerability**: Any authenticated user can assign themselves any role including admin. The security scan flagged this as PRIVILEGE_ESCALATION.
- **Stats queries use `user_roles` table count** for "Total Users" which is incorrect (counts roles, not users).
- **Admin dashboard navigation** works but links to sub-pages need verification.

### 4. Customer: Checkout "Continue" Button Not Visible
- **The sticky footer bar** at `bottom-0` with `z-50` should be visible. However, the `pb-40` padding on the content div may not be enough on shorter screens, and the bottom bar may be clipped by the viewport or obscured by the safe-area inset on iOS devices.

---

## Implementation Plan

### Step 1: Fix `app_users` View (Unblocks Riders + Vendors)
Revert `app_users` from `security_invoker = on` back to a `SECURITY DEFINER` view. The previous security change broke all queries that join `app_users` because authenticated users cannot read `auth.users` directly.

```sql
DROP VIEW IF EXISTS public.app_users;
CREATE VIEW public.app_users AS
  SELECT id, email,
    raw_user_meta_data->>'first_name' AS first_name,
    raw_user_meta_data->>'last_name' AS last_name,
    raw_user_meta_data->>'phone' AS phone
  FROM auth.users;
-- Grant access
GRANT SELECT ON public.app_users TO authenticated, anon;
```

### Step 2: Fix `premium_deliveries` RLS Policies (Unblocks Riders + Checkout)
- Add INSERT policy for customers creating premium deliveries during checkout.
- Fix UPDATE policy to use `rider_profiles.id` instead of `auth.uid()` for rider_id comparison.

```sql
-- Allow customers to create premium deliveries for their orders
CREATE POLICY "Customers create premium deliveries for own orders"
  ON public.premium_deliveries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM premium_orders po
    WHERE po.id = premium_deliveries.premium_order_id
      AND po.customer_id = auth.uid()
  ));

-- Fix rider UPDATE to use rider_profiles lookup
DROP POLICY IF EXISTS "Riders update assigned premium deliveries" ON public.premium_deliveries;
CREATE POLICY "Riders update assigned premium deliveries"
  ON public.premium_deliveries FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.id = premium_deliveries.rider_id AND rp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix rider SELECT similarly
DROP POLICY IF EXISTS "Users view own premium deliveries" ON public.premium_deliveries;
CREATE POLICY "Users view own premium deliveries"
  ON public.premium_deliveries FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.id = premium_deliveries.rider_id AND rp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM premium_orders po WHERE po.id = premium_deliveries.premium_order_id AND po.customer_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Allow riders to claim pending premium deliveries
CREATE POLICY "Riders claim pending premium deliveries"
  ON public.premium_deliveries FOR UPDATE TO authenticated
  USING (status = 'pending' AND rider_id IS NULL)
  WITH CHECK (EXISTS (
    SELECT 1 FROM rider_profiles rp WHERE rp.user_id = auth.uid() AND rp.id = premium_deliveries.rider_id
  ));
```

### Step 3: Fix `trash_deliveries` Rider UPDATE Policy
Same issue -- fix rider_id comparison.

```sql
DROP POLICY IF EXISTS "Riders update assigned trash deliveries" ON public.trash_deliveries;
CREATE POLICY "Riders update assigned trash deliveries"
  ON public.trash_deliveries FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.id = trash_deliveries.rider_id AND rp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
```

### Step 4: Fix `rider_wallet` and `rider_wallet_tx` Policies
Same issue -- `rider_id` is the profile ID, not `auth.uid()`.

```sql
DROP POLICY IF EXISTS "Riders view own wallet" ON public.rider_wallet;
CREATE POLICY "Riders view own wallet"
  ON public.rider_wallet FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.id = rider_wallet.rider_id AND rp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Riders view own transactions" ON public.rider_wallet_tx;
CREATE POLICY "Riders view own transactions"
  ON public.rider_wallet_tx FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.id = rider_wallet_tx.rider_id AND rp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
```

### Step 5: Fix `user_roles` Privilege Escalation
Remove the dangerous self-insert policy. Role assignment should only happen via triggers (`handle_new_user`, `handle_new_vendor`, etc.) and admin operations.

```sql
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
```

### Step 6: Fix Vendor Delivery Creation Flow
Add a "Create Delivery" action in `ActiveOrdersPanel.tsx` when order status is "ready", so vendors can dispatch orders for rider pickup. This creates a row in `deliveries` table using the existing `vendors_create_deliveries_safe` INSERT policy.

**File**: `src/components/vendor/dashboard/ActiveOrdersPanel.tsx`
- Add a "Dispatch for Delivery" button on orders with status "ready"
- Insert into `deliveries` table with `order_id`, `estate_id`, and `status: 'pending'`

### Step 7: Fix Checkout Button Visibility
**File**: `src/pages/Checkout.tsx`
- Increase bottom padding from `pb-40` to `pb-48` to ensure content doesn't hide behind the sticky footer
- Add `safe-area-inset-bottom` support on the sticky bar for iOS devices
- Ensure the sticky bar has solid background and proper elevation

### Step 8: Fix Admin Dashboard Stats
**File**: `src/pages/admin/AdminDashboard.tsx`
- Fix "Total Users" to count distinct `user_id` from `user_roles` instead of all rows

---

## Summary of Changes

| Area | Root Cause | Fix |
|------|-----------|-----|
| Rider can't accept | `rider_id != auth.uid()` in RLS | Use `rider_profiles` join in policies |
| Rider sees no deliveries | `app_users` view broken by `security_invoker` | Revert to definer view |
| Vendor can't dispatch | No delivery creation code | Add dispatch button |
| Premium checkout fails | No INSERT policy on `premium_deliveries` | Add customer INSERT policy |
| Checkout button hidden | Insufficient padding + no safe-area | Increase padding + safe area |
| Admin privilege escalation | Self-insert role policy | Remove dangerous policy |
| Wallet/tx invisible to riders | Same `rider_id` mismatch | Fix RLS policies |

