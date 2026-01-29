
# Pharmacy Vendor Portal Design Plan

## Overview

This plan creates a specialized vendor portal for **Pharmacy** vendors (`business_type == 'pharmacy'`). Pharmacies are unique because they require a **hybrid model** that combines:
- **Inventory products** (medicines, supplements, personal care)
- **Booking services** (consultations, health checks)

We need to:
1. Update the database trigger to use the new streamlined category system
2. Create a new PharmacyView for customer-facing pages
3. Update the vendor dashboard to handle the pharmacy operational type
4. Ensure the CategoryManagement works correctly for pharmacy vendors

---

## Part 1: Database Trigger Update

The current trigger maps 30+ business types to operational categories. It needs to be updated to match our new streamlined 9-category structure.

### New Trigger SQL

```sql
CREATE OR REPLACE FUNCTION public.assign_vendor_operational_category()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- default to inventory
  NEW.operational_category := 'inventory';

  CASE NEW.business_type
    -- INVENTORY categories (4)
    WHEN 'food-drinks' THEN NEW.operational_category := 'inventory';
    WHEN 'living-essentials' THEN NEW.operational_category := 'inventory';
    WHEN 'groceries-food' THEN NEW.operational_category := 'inventory';
    WHEN 'restaurant' THEN NEW.operational_category := 'inventory';

    -- SERVICE categories (2)
    WHEN 'utilities-services' THEN NEW.operational_category := 'service';
    WHEN 'home-services' THEN NEW.operational_category := 'service';

    -- BOOKING categories (2)
    WHEN 'beauty-spa' THEN NEW.operational_category := 'booking';
    WHEN 'accommodation' THEN NEW.operational_category := 'booking';

    -- PHARMACY (special hybrid type)
    WHEN 'pharmacy' THEN NEW.operational_category := 'pharmacy';
    
    -- Legacy fallbacks (for existing data)
    WHEN 'groceries-essentials' THEN NEW.operational_category := 'inventory';
    WHEN 'liquor-store' THEN NEW.operational_category := 'inventory';
    WHEN 'fashion-clothing' THEN NEW.operational_category := 'inventory';
    WHEN 'electronics-gadgets' THEN NEW.operational_category := 'inventory';
    WHEN 'minimart' THEN NEW.operational_category := 'inventory';
    WHEN 'home-services' THEN NEW.operational_category := 'service';
    WHEN 'repairs-maintenance' THEN NEW.operational_category := 'service';
    WHEN 'health-wellness' THEN NEW.operational_category := 'booking';
    WHEN 'beauty-spa' THEN NEW.operational_category := 'booking';
    ELSE NEW.operational_category := 'inventory';
  END CASE;

  RETURN NEW;
END;
$function$;
```

You will need to run this in your Supabase SQL editor to update the trigger.

---

## Part 2: Create Pharmacy View Component

A new view that displays both products and booking services in a tabbed/sectioned layout.

### File: `src/pages/vendor/views/PharmacyView.tsx`

The PharmacyView will:
- Show a **Tabs** interface with "Products" and "Consultations" tabs
- Products tab displays inventory items (medicines, supplements, etc.)
- Consultations tab displays bookable services with calendar/slot selection
- Use existing cart context for both product purchases and booking appointments

### Component Structure

```text
+-------------------------------------------------------+
|  💊 Shop Products  |  📅 Book Consultation           |
+-------------------------------------------------------+
|                                                       |
|  [Tab Content - Either Products Grid or Booking UI]  |
|                                                       |
+-------------------------------------------------------+
```

---

## Part 3: Update VendorHome.tsx

Add pharmacy support to render the new PharmacyView when `operational_category === 'pharmacy'`.

### Changes to VendorHome.tsx

Add import for PharmacyView and conditional rendering:

```typescript
import { PharmacyView } from "./views/PharmacyView";

// In render section, add:
{vendor.operational_category === 'pharmacy' && <PharmacyView vendor={vendor} products={products} />}
```

---

## Part 4: Update NewVendorDashboard.tsx

Add pharmacy-specific quick actions and navigation buttons.

### Changes

1. Add pharmacy type to VendorProfile interface
2. Add conditional quick action buttons for pharmacy vendors:
   - "Products" button (for inventory management)
   - "Consultations" button (for booking management)
3. Show both product and booking management in dashboard

---

## Part 5: Create Pharmacy-Specific Management Page (Optional Enhancement)

A combined management page for pharmacy vendors that shows:
- Product inventory (medicines, supplies)
- Consultation bookings
- Prescription requests (future feature)

### File: `src/pages/vendor/PharmacyManagement.tsx`

This page will be a tabbed interface combining:
- ProductManagement functionality
- VendorBookingManagement functionality

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/vendor/views/PharmacyView.tsx` | **CREATE** | Customer-facing pharmacy view with products + consultations |
| `src/pages/vendor/VendorHome.tsx` | MODIFY | Add pharmacy case to conditional rendering |
| `src/pages/vendor/NewVendorDashboard.tsx` | MODIFY | Add pharmacy quick actions |
| `src/App.tsx` | MODIFY | Add route for pharmacy management page |
| Database Trigger | UPDATE | Run SQL to update `assign_vendor_operational_category()` |

---

## Technical Implementation Details

### 1. PharmacyView Component Structure

```typescript
interface PharmacyViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

export function PharmacyView({ vendor, products }: PharmacyViewProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'consultations'>('products');
  
  // Split products by item_type
  const inventoryProducts = products.filter(p => p.item_type !== 'booking');
  const bookingProducts = products.filter(p => p.item_type === 'booking');
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="products">💊 Shop Products</TabsTrigger>
        <TabsTrigger value="consultations">📅 Book Consultation</TabsTrigger>
      </TabsList>
      
      <TabsContent value="products">
        {/* Inventory grid similar to InventoryView */}
      </TabsContent>
      
      <TabsContent value="consultations">
        {/* Booking UI similar to BookingView */}
      </TabsContent>
    </Tabs>
  );
}
```

### 2. Product Type Distinction

Pharmacy products will use the `item_type` field:
- `item_type: 'inventory'` → Regular products (medicines, supplies)
- `item_type: 'booking'` → Consultation services

### 3. Subcategory Mapping for Pharmacy

From the categories.ts file, pharmacy subcategories are:
- **Booking**: Consultation
- **Inventory**: Prescription Medicine, Over-the-Counter Medicine, Family Planning, First Aid Supplies, Vitamins & Supplements, Baby Care, Personal Hygiene, Medical Devices

### 4. Cart Integration

Both product purchases and booking appointments use the existing CartContext:
- Products: Standard cart item with price and quantity
- Bookings: Cart item with `bookingDetails: { slot_start, slot_end }`

---

## User Experience Flow

### Customer View (VendorHome → PharmacyView)

1. Customer visits pharmacy vendor page
2. Sees two tabs: "Shop Products" and "Book Consultation"
3. **Shop Products**: Browse medicines by subcategory, add to cart
4. **Book Consultation**: Select service type, pick date/time slot, add to cart
5. Checkout handles both product orders and booking confirmations

### Vendor Dashboard (NewVendorDashboard)

1. Vendor logs in, sees pharmacy-specific dashboard
2. Quick actions show both "Products" and "Consultations" buttons
3. Can manage inventory products via ProductManagement
4. Can manage consultation slots via VendorBookingManagement
5. Analytics show combined metrics for both

---

## Implementation Priority

1. **Step 1**: Update database trigger (SQL - manual step)
2. **Step 2**: Create PharmacyView component
3. **Step 3**: Update VendorHome.tsx to use PharmacyView
4. **Step 4**: Update NewVendorDashboard.tsx for pharmacy actions
5. **Step 5**: Add App.tsx route (if creating dedicated management page)
6. **Step 6**: Test end-to-end flow
