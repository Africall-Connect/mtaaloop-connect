

# Fix Complete Order Workflow: Customer → Vendor → Rider → Delivered

## Root Cause Analysis

After thorough investigation, the order flow has these issues:

### Issue 1: Riders CANNOT claim deliveries (Critical)
The `rider_can_claim_pending_delivery` RLS policy on `deliveries` has:
- USING: `status = 'pending' AND rider_id IS NULL` (correct — matches pending unclaimed rows)
- WITH CHECK: `status = 'pending' AND EXISTS(rider_profiles rp WHERE rp.user_id = auth.uid() AND rp.id = deliveries.rider_id)`

The code in `acceptDelivery()` updates BOTH `rider_id` AND `status = 'assigned'` in one UPDATE. The WITH CHECK requires `status = 'pending'` but the NEW row has `status = 'assigned'` — so **every claim fails silently**.

**Fix**: Update the WITH CHECK to allow `status = 'assigned'` (the target status after claiming).

### Issue 2: Same bug on `premium_deliveries` claim policy
The `Riders claim pending premium deliveries` policy has the same pattern — USING allows pending/null but WITH CHECK doesn't account for the status change to `assigned`.

### Issue 3: `trash_deliveries` has no claim policy at all
Riders need an UPDATE policy to claim pending trash deliveries (set rider_id + status). Currently only the "Riders update assigned trash deliveries" policy exists (requires rider already assigned).

### Issue 4: Vendor dispatch doesn't update order status correctly
`ActiveOrdersPanel.dispatchForDelivery()` updates order to `out_for_delivery` immediately when dispatching. Per the required flow, it should be `ready_for_pickup` or stay at `ready` until rider accepts. The rider acceptance should trigger `out_for_delivery`.

### Issue 5: `sync_order_status_on_delivery_update` trigger maps incorrectly
The DB trigger syncs `delivery.status = 'picked'` → `order.status = 'in_transit'` and `delivery.status = 'delivered'` → `order.status = 'delivered'`. But it doesn't handle `delivery.status = 'assigned'` → update order to show rider accepted.

### Issue 6: Customer real-time tracking uses `in_transit` but vendor sets `out_for_delivery`
The `OrderTracking.tsx` customer page listens for `in_transit` status but vendor code sets `out_for_delivery`. These need alignment.

---

## Implementation Plan

### Step 1: SQL Migration — Fix delivery claim RLS policies

Fix the `rider_can_claim_pending_delivery` policy on `deliveries`:
```sql
DROP POLICY IF EXISTS "rider_can_claim_pending_delivery" ON public.deliveries;
CREATE POLICY "rider_can_claim_pending_delivery"
  ON public.deliveries FOR UPDATE TO authenticated
  USING (status = 'pending' AND rider_id IS NULL)
  WITH CHECK (
    status = 'assigned' AND
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.user_id = auth.uid() AND rp.id = deliveries.rider_id)
  );
```

Fix the `Riders claim pending premium deliveries` policy:
```sql
DROP POLICY IF EXISTS "Riders claim pending premium deliveries" ON public.premium_deliveries;
CREATE POLICY "Riders claim pending premium deliveries"
  ON public.premium_deliveries FOR UPDATE TO authenticated
  USING (status = 'pending' AND rider_id IS NULL)
  WITH CHECK (
    status = 'assigned' AND
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.user_id = auth.uid() AND rp.id = premium_deliveries.rider_id)
  );
```

Add claim policy for `trash_deliveries`:
```sql
CREATE POLICY "Riders claim pending trash deliveries"
  ON public.trash_deliveries FOR UPDATE TO authenticated
  USING (status = 'pending' AND rider_id IS NULL)
  WITH CHECK (
    status = 'assigned' AND
    EXISTS (SELECT 1 FROM rider_profiles rp WHERE rp.user_id = auth.uid() AND rp.id = trash_deliveries.rider_id)
  );
```

### Step 2: SQL Migration — Update `sync_order_status_on_delivery_update` trigger

Update the trigger to handle the full flow:
- `delivery.assigned` → `order.status = 'out_for_delivery'` (rider accepted)
- `delivery.picked` → `order.status = 'in_transit'` (picked up from vendor)
- `delivery.delivered` → `order.status = 'delivered'`

```sql
CREATE OR REPLACE FUNCTION public.sync_order_status_on_delivery_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'assigned' AND OLD.status = 'pending' THEN
    UPDATE orders SET status = 'out_for_delivery', updated_at = now() WHERE id = NEW.order_id;
  END IF;
  IF NEW.status = 'picked' AND OLD.status != 'picked' THEN
    UPDATE orders SET status = 'in_transit', updated_at = now() WHERE id = NEW.order_id;
  END IF;
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE orders SET status = 'delivered', delivered_at = now(), updated_at = now() WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$;
```

### Step 3: Fix `ActiveOrdersPanel.tsx` — Vendor dispatch flow

Change `dispatchForDelivery()` to NOT update order status to `out_for_delivery`. Instead, keep order at `ready` and only create the delivery record with `status: 'pending'`. The trigger in Step 2 will handle status sync when rider claims it.

Also add `order_number` generation for regular orders in the Checkout flow (currently missing).

### Step 4: Fix `ActiveOrdersPanel.tsx` — Align status labels and button flow

Update the vendor status flow to match the required sequence:
- `pending` → Accept (sets `accepted`) / Reject (sets `cancelled`)
- `accepted` → Start Preparing (sets `preparing`)
- `preparing` → Mark Ready (sets `ready`)
- `ready` → Dispatch for Delivery (creates `deliveries` row with `pending` status, order stays `ready`)
- After rider claims: order auto-updates to `out_for_delivery` via trigger

### Step 5: Fix `OrderTracking.tsx` — Customer-side status alignment

Add `out_for_delivery` to the customer's status timeline so it shows "Rider Accepted" between `ready` and `in_transit`. Update progress mapping and notification messages.

### Step 6: Add real-time subscription in rider dashboard

Add a Supabase realtime channel subscription on `deliveries` table in `AvailableDeliveries.tsx` so new dispatched orders appear instantly without manual refresh.

---

## Files to Edit

| File | Change |
|------|--------|
| **SQL Migration** | Fix 3 claim policies, update sync trigger |
| `src/components/vendor/dashboard/ActiveOrdersPanel.tsx` | Fix dispatch to not update order status |
| `src/pages/OrderTracking.tsx` | Add `out_for_delivery` status handling |
| `src/components/rider/AvailableDeliveries.tsx` | Add realtime subscription |
| `src/pages/Checkout.tsx` | Generate `order_number` for regular orders |

## Complete Status Flow After Fix

```text
Customer places order → order.status = 'pending'
                        (no delivery row yet)

Vendor accepts       → order.status = 'accepted'
                        Customer notified ✅

Vendor prepares      → order.status = 'preparing'

Vendor marks ready   → order.status = 'ready'

Vendor dispatches    → Creates deliveries row (status='pending')
                        order.status stays 'ready'

Rider claims         → deliveries.status = 'assigned'
                        Trigger → order.status = 'out_for_delivery'
                        Customer notified ✅

Rider picks up       → deliveries.status = 'picked'
                        Trigger → order.status = 'in_transit'

Rider delivers       → deliveries.status = 'delivered'
                        Trigger → order.status = 'delivered'
                        Customer notified ✅
```

