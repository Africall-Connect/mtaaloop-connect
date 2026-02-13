

# POS (Point of Sale) System for Inventory Vendors

## What This Does

Adds a "Quick Sale" POS mode to the vendor dashboard for inventory-type vendors. When a customer buys in-person (off-app), the vendor can quickly record the sale, automatically decrement stock, and keep a history of all walk-in transactions -- all without needing to create a full app order.

---

## Database Changes

### New Table: `pos_sales`

A lightweight table to track walk-in/off-app sales separately from regular app orders.

```sql
CREATE TABLE public.pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  sale_number text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  discount decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  customer_name text,
  customer_phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pos_sales_vendor_id ON public.pos_sales(vendor_id);
CREATE INDEX idx_pos_sales_created_at ON public.pos_sales(created_at DESC);

ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own POS sales"
  ON public.pos_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles
      WHERE id = pos_sales.vendor_id
      AND user_id = auth.uid()
    )
  );
```

The `items` JSONB column stores an array like:
```json
[
  { "product_id": "uuid", "name": "Bread", "quantity": 2, "price": 50, "total": 100 }
]
```

---

## New Page: `/vendor/pos`

### File: `src/pages/vendor/VendorPOS.tsx`

A full-screen POS interface optimized for quick sales with the following sections:

**Left Panel (Product Grid)**
- Search bar to quickly find products
- Grid of product cards (image, name, price) pulled from existing `products` table
- Tap a product to add it to the current sale
- Filter by category

**Right Panel (Current Sale Cart)**
- List of items being sold with quantity +/- controls
- Running subtotal
- Optional discount field (flat amount)
- Total calculation
- Payment method selector: Cash, M-Pesa, Card
- Optional customer name/phone fields
- "Complete Sale" button

**On Complete Sale:**
1. Insert a row into `pos_sales` with all items
2. Decrement `stock_quantity` for each product in the `products` table
3. Show a simple receipt summary (can be printed)
4. Clear the cart for the next sale

**Bottom Section: Recent Sales**
- Scrollable list of today's POS sales
- Shows sale number, time, total, payment method
- Tap to view receipt details

---

## UI Design (Mobile-First)

On mobile, the layout stacks vertically:

```text
+----------------------------------+
| [Back]  POINT OF SALE   [Sales] |
+----------------------------------+
| [Search products...]             |
| [Category filter chips]          |
+----------------------------------+
| Product Grid (2 cols)            |
| [Bread  50] [Milk  60]          |
| [Eggs  15]  [Sugar 180]         |
+----------------------------------+
| CURRENT SALE (sticky bottom)     |
| Bread x2          KES 100       |
| Milk x1           KES  60       |
|                   --------       |
| Subtotal:         KES 160       |
| Discount:        -KES   0       |
| TOTAL:            KES 160       |
| [Cash] [M-Pesa] [Card]          |
| [ Complete Sale ]                |
+----------------------------------+
```

On desktop, it's a side-by-side layout:
- Left 60%: Product search + grid
- Right 40%: Cart + payment + complete

---

## Receipt Modal

After completing a sale, a modal shows:
- Sale number (auto-generated: `POS-001`, `POS-002`, etc.)
- Date/time
- Items with quantities and prices
- Total
- Payment method
- "Print Receipt" button (uses `window.print()`)
- "New Sale" button to reset

---

## Sales History Sheet

A slide-out panel showing:
- Today's sales summary (count, total revenue)
- List of all POS sales with filters (today, this week, this month)
- Each sale expandable to show items

---

## Dashboard Integration

### File: `src/pages/vendor/NewVendorDashboard.tsx`

Add a "POS / Quick Sale" button in the quick actions section, visible only when `operational_category === 'inventory'`:

```text
[POS Quick Sale] -- navigates to /vendor/pos
```

---

## Route Registration

### File: `src/App.tsx`

Add the new route:
```tsx
<Route path="/vendor/pos" element={
  <ProtectedRoute requiredRole="vendor" requireApproval>
    <VendorPOS />
  </ProtectedRoute>
} />
```

---

## Stock Decrement Logic

When a POS sale is completed, for each item in the cart:

```typescript
await supabase.rpc('decrement_stock', { 
  p_product_id: item.product_id, 
  p_quantity: item.quantity 
});
```

We'll create a simple Postgres function for atomic stock decrement:

```sql
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/vendor/VendorPOS.tsx` | Main POS page with product grid, cart, payment |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/vendor/pos` route |
| `src/pages/vendor/NewVendorDashboard.tsx` | Add POS quick action button for inventory vendors |

## SQL to Run

| Script | Purpose |
|--------|---------|
| Create `pos_sales` table | Store walk-in sale records |
| Create `decrement_stock` function | Atomic stock updates |
| RLS policies | Vendor-only access to their POS sales |

---

## Key POS Features Summary

1. **Quick Product Search** -- find items instantly by name
2. **Tap-to-Add** -- single tap adds product to cart
3. **Quantity Controls** -- adjust quantities inline
4. **Discount Support** -- apply flat discount per sale
5. **Payment Method Tracking** -- Cash, M-Pesa, Card
6. **Auto Stock Decrement** -- stock updates on sale completion
7. **Receipt View** -- printable receipt after each sale
8. **Sales History** -- view today's and past POS transactions
9. **Mobile Optimized** -- works on phone as a handheld POS

