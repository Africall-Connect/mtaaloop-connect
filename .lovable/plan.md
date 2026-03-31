

# Integrate Payment Type into Rider Workflow

## Summary

The `orders` table lacks a `payment_method` column. The checkout has three payment options (`wallet`, `mpesa`, `pay_on_delivery`) but never persists which one was chosen. This means riders cannot distinguish COD from prepaid orders, and the `prevent_unpaid_delivery_start` trigger blocks delivery completion for all non-prepaid orders.

## Changes

### Step 1: Database Migration — Add `payment_method` column to `orders`

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'wallet';

-- Also add to premium_orders for consistency
ALTER TABLE public.premium_orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'wallet';
```

### Step 2: Database Migration — Update `prevent_unpaid_delivery_start` trigger

Change the trigger to allow delivery completion for COD orders (rider collects cash), and only block if payment has explicitly `failed`:

```sql
CREATE OR REPLACE FUNCTION public.prevent_unpaid_delivery_start()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'delivered' THEN
      IF EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = NEW.order_id
          AND o.payment_status = 'failed'
      ) THEN
        RAISE EXCEPTION 'Cannot complete delivery: payment failed';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
```

### Step 3: Checkout — Store `paymentMethod` on order creation

In `src/pages/Checkout.tsx`, add `payment_method: paymentMethod` to all order insert calls (regular, mtaaloop). For `pay_on_delivery`, also set `payment_status: 'cod_pending'` instead of the default `'pending'`.

### Step 4: Rider API — Include payment data in delivery queries

In `src/lib/riderDeliveries.ts`:
- `fetchActiveNormalDeliveries`: add `payment_method, payment_status, total_amount` to the `orders` select
- Update `ActiveDelivery` interface to include `payment_method`, `payment_status`

### Step 5: Rider UI — Display payment info and "Mark as Paid" button

In `src/components/rider/ActiveDeliveries.tsx`:
- Show "Paid" badge for prepaid orders (`payment_status === 'paid'`)
- Show "Collect KES X" badge for COD orders (`payment_method === 'pay_on_delivery'`)
- Add "Mark as Paid" button for COD orders — updates `orders.payment_status` to `'paid'` and `orders.paid_at`
- Block "Mark as Delivered" button if COD and `payment_status !== 'paid'` (show tooltip explaining why)

### Step 6: RLS — Allow rider to update payment_status on assigned orders

Add an RLS policy so riders can update `payment_status` on orders linked to their active deliveries:

```sql
CREATE POLICY "rider_mark_cod_paid"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      JOIN rider_profiles rp ON rp.id = d.rider_id
      WHERE d.order_id = orders.id
        AND rp.user_id = auth.uid()
        AND d.status IN ('assigned', 'picked')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliveries d
      JOIN rider_profiles rp ON rp.id = d.rider_id
      WHERE d.order_id = orders.id
        AND rp.user_id = auth.uid()
        AND d.status IN ('assigned', 'picked')
    )
  );
```

## Files to Edit

| File | Change |
|------|--------|
| **SQL Migration** | Add `payment_method` column, update trigger, add RLS policy |
| `src/pages/Checkout.tsx` | Store `payment_method` on order insert |
| `src/lib/riderDeliveries.ts` | Include payment fields in queries, update types |
| `src/components/rider/ActiveDeliveries.tsx` | Show payment info, add "Mark as Paid" button, block delivery completion for unpaid COD |

## Flow After Fix

```text
Checkout (wallet)       → payment_method='wallet', payment_status='paid'
Checkout (pay_on_delivery) → payment_method='pay_on_delivery', payment_status='cod_pending'

Rider sees COD order    → Badge: "Collect KES 1,500"
Rider clicks "Mark as Paid" → payment_status='paid'
Rider clicks "Mark as Delivered" → allowed (payment_status='paid')

Rider sees prepaid order → Badge: "Paid ✓"
Rider clicks "Mark as Delivered" → allowed immediately
```

