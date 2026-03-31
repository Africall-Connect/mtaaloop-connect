

# Fix Vendor-to-Rider Dispatch Flow

## Root Cause Analysis

After investigating the full flow (RLS policies, DB triggers, frontend code), the system is mostly wired correctly from a previous fix. The RLS policies on `deliveries` already allow:
- Vendors to INSERT via `can_vendor_create_delivery(order_id)` ✅
- Riders to SELECT pending deliveries (`status='pending' AND rider_id IS NULL`) ✅
- Riders to claim (`rider_can_claim_pending_delivery` WITH CHECK allows `status='assigned'`) ✅
- Trigger `sync_order_status_on_delivery_update` handles `assigned → out_for_delivery` ✅

**The remaining issues are:**

### Issue 1: Estate ID filtering silently drops deliveries
`fetchNormalDeliveries(estateId)` applies `.eq('estate_id', estateId)`. If the order's `estate_id` is NULL (e.g., customer didn't set their estate), or the rider's `estate_id` is different, the delivery is invisible to all riders. This is the most likely cause of "rider not seeing dispatched orders."

**Fix**: Fall back to showing all pending deliveries if estate_id matching fails, or broaden the query to also include deliveries where `estate_id` is NULL.

### Issue 2: Vendor dispatch doesn't provide error feedback for duplicate dispatch
If a vendor clicks "Dispatch" twice, the second insert could fail silently or create a duplicate delivery row. No guard prevents re-dispatch.

**Fix**: Check if a delivery already exists for the order before inserting. Also disable the dispatch button while in-flight.

### Issue 3: Vendor "Dispatch" button shows for `ready` status but order status stays `ready` with no visual indicator
After dispatching, the order stays at `ready` status until a rider claims. The vendor sees the same "Dispatch" button again.

**Fix**: Track whether a delivery row exists for the order and show a "Waiting for Rider" state instead of the dispatch button.

### Issue 4: No logging or error toast for RLS failures
If `dispatchForDelivery` or `acceptDelivery` fails due to RLS, the error is caught but the message is generic. Need better error surfacing.

---

## Implementation Plan

### Step 1: Fix `riderDeliveries.ts` — Broaden estate filter

Change `fetchNormalDeliveries` and `fetchPremiumDeliveries` to also include deliveries with NULL `estate_id`, so orders from customers without estate preference still appear to riders:

```ts
// Instead of: .eq('estate_id', estateId)
// Use: .or(`estate_id.eq.${estateId},estate_id.is.null`)
```

Also handle the case where the rider has no `estate_id` — show all pending deliveries instead of returning empty.

### Step 2: Fix `ActiveOrdersPanel.tsx` — Prevent duplicate dispatch + show dispatch state

- Before inserting a delivery, check if one already exists for the order
- After dispatch, change the button to show "⏳ Awaiting Rider" instead of showing the dispatch button again
- Fetch delivery status alongside orders to know which ones have been dispatched

### Step 3: Fix `ActiveOrdersPanel.tsx` — Add `out_for_delivery` to status configs

The `getStatusInfo` map doesn't include `out_for_delivery`, so when the trigger updates the order status after rider claims, the vendor sees no label. Add it.

### Step 4: Add console logging for debugging

Add `console.log` breadcrumbs in:
- `dispatchForDelivery` (before/after insert)
- `fetchNormalDeliveries` (query result count)
- `acceptDelivery` (before/after update)

This enables future debugging via browser console.

---

## Files to Edit

| File | Change |
|------|--------|
| `src/lib/riderDeliveries.ts` | Broaden estate_id filter to include NULL; handle rider with no estate |
| `src/components/vendor/dashboard/ActiveOrdersPanel.tsx` | Prevent double dispatch; show "Awaiting Rider" state; add `out_for_delivery` status |

No SQL migration needed — RLS and triggers are already correct from the prior fix.

