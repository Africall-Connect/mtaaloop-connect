
# Fix: Checkout Email Not Being Passed to Paystack

## Problem Identified

The Paystack checkout modal displays "no-email@mtaaloop.com" instead of your actual email (misaroonserio@gmail.com) because:

1. **Missing database column**: The `orders` table does not have a `user_email` column
2. **Missing data in order creation**: When creating an order in Checkout.tsx, the user's email is not being saved
3. **Edge function expects missing data**: The `payments-paystack-init` function tries to read `order.user_email` which returns `null`
4. **Paystack fallback**: Paystack uses a default email from your dashboard settings when it receives an empty/null email

## Solution

### Step 1: Add `user_email` column to orders table

Create a new migration to add the missing column:

```sql
-- Add user_email column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Optionally set a default based on customer_id for existing orders
UPDATE public.orders o
SET user_email = u.email
FROM auth.users u
WHERE o.customer_id = u.id
AND o.user_email IS NULL;
```

### Step 2: Update Checkout.tsx to include user email

When creating regular orders (around line 581-594), add the user's email:

**Current code:**
```typescript
const { error: orderError } = await supabase.from("orders").insert([
  {
    id: orderId,
    customer_id: user?.id,
    vendor_id: orderDetails.vendorId,
    estate_id: orderDetails.estateId,
    total_amount: orderDetails.totalAmount,
    delivery_address: orderDetails.deliveryAddress,
    customer_notes: orderDetails.customerNotes,
    category: orderDetails.category,
    house: deliveryAddress.house_number,
    full_name: fullName,
  },
]);
```

**Updated code:**
```typescript
const { error: orderError } = await supabase.from("orders").insert([
  {
    id: orderId,
    customer_id: user?.id,
    vendor_id: orderDetails.vendorId,
    estate_id: orderDetails.estateId,
    total_amount: orderDetails.totalAmount,
    delivery_address: orderDetails.deliveryAddress,
    customer_notes: orderDetails.customerNotes,
    category: orderDetails.category,
    house: deliveryAddress.house_number,
    full_name: fullName,
    user_email: user?.email,  // Add user email for Paystack
  },
]);
```

### Step 3: Add fallback in edge function

Update the edge function to fetch email from auth.users if not in order:

**In `payments-paystack-init/index.ts`:**
```typescript
// After fetching order, add fallback for email
let userEmail = order.user_email;

// If no email in order, fetch from auth.users
if (!userEmail && order.user_id) {
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
  userEmail = userData?.user?.email;
}

// Final fallback (should never reach this if user is authenticated)
if (!userEmail) {
  console.error("No email found for order:", order_id);
  return new Response(JSON.stringify({ error: "User email not found" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Use userEmail in Paystack request
body: JSON.stringify({
  email: userEmail,
  // ... rest of payload
}),
```

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Checkout.tsx` | Add `user_email: user?.email` to all order insert statements |
| `supabase/functions/payments-paystack-init/index.ts` | Add fallback to fetch email from auth.users if not in order |
| New migration SQL | Add `user_email` column to orders table |

## Summary

The fix ensures:
- Your actual email (from Supabase Auth) is saved when creating orders
- The Paystack payment modal shows your correct email
- Backward compatibility for existing orders via edge function fallback
