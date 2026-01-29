

# Add Liquor Store Category Plan

## Overview

This plan adds **Liquor Store** as a new main category under the **Inventory** operational type, along with its subcategories. It also adds "Liquor" as a subcategory under "Food & Drinks" for vendors who sell alcohol alongside food.

---

## Changes Summary

### 1. New Main Category: Liquor Store

| Category | Operational Type | Subcategories |
|----------|------------------|---------------|
| **Liquor Store** | Inventory | Beer, Wine, Spirits, Whiskey & Bourbon, Vodka, Gin, Rum, Tequila, Champagne & Sparkling, Ready-to-Drink (RTDs), Mixers & Soft Drinks |

### 2. New Subcategory for Food & Drinks

Add "Liquor" to the existing "Food & Drinks" subcategory list for restaurants/cafes that also serve alcohol.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/categories.ts` | Add "Liquor Store" to `INVENTORY_CATEGORIES` and `MAIN_CATEGORIES`, add subcategories |
| `src/constants/categories.ts` | Mirror the same changes |
| `src/pages/auth/VendorSignup.tsx` | Add "Liquor Store" option to business type dropdown |
| `src/pages/vendor/CategoryManagement.tsx` | Add "Liquor Store" to `INVENTORY_CATEGORIES` constant |
| `src/pages/OrderTracking.tsx` | Already has "Liquor Store" messaging - no changes needed |

---

## Detailed Changes

### 1. `src/lib/categories.ts`

**Update INVENTORY_CATEGORIES (line 5-10):**
```typescript
export const INVENTORY_CATEGORIES = [
  "Food & Drinks",
  "Living Essentials",
  "Groceries & Food",
  "Restaurant",
  "Liquor Store",  // NEW
] as const;
```

**Update MAIN_CATEGORIES (line 30-44):**
```typescript
export const MAIN_CATEGORIES = [
  // Inventory
  "Food & Drinks",
  "Living Essentials",
  "Groceries & Food",
  "Restaurant",
  "Liquor Store",  // NEW
  // Service
  "Utilities & Services",
  "Home Services",
  // Booking
  "Beauty & Spa",
  "Accommodation",
  // Pharmacy (Hybrid)
  "Pharmacy",
] as const;
```

**Add Liquor subcategory to Food & Drinks (line 49-62):**
```typescript
"Food & Drinks": [
  "Fast Food",
  "Traditional Food",
  "Cafes & Coffee Shops",
  "Bakery & Pastries",
  "International Cuisine",
  "Pizza",
  "Burgers & Sandwiches",
  "Chicken & Wings",
  "Seafood",
  "Vegetarian & Vegan",
  "Juice Bar & Smoothies",
  "Ice Cream",
  "Liquor",  // NEW - for restaurants that also serve alcohol
],
```

**Add new Liquor Store subcategories (after line 84):**
```typescript
"Liquor Store": [
  "Beer",
  "Wine",
  "Spirits",
  "Whiskey & Bourbon",
  "Vodka",
  "Gin",
  "Rum",
  "Tequila",
  "Champagne & Sparkling",
  "Ready-to-Drink (RTDs)",
  "Mixers & Soft Drinks",
],
```

### 2. `src/constants/categories.ts`

**Update MAIN_CATEGORIES (line 5-19):**
Add Liquor Store option:
```typescript
{ value: "Liquor Store", label: "Liquor Store" },
```

**Add Liquor to Food & Drinks subcategories (line 24-37):**
Add "Liquor" to the array.

**Add Liquor Store subcategories (after line 59):**
```typescript
"Liquor Store": [
  "Beer",
  "Wine",
  "Spirits",
  "Whiskey & Bourbon",
  "Vodka",
  "Gin",
  "Rum",
  "Tequila",
  "Champagne & Sparkling",
  "Ready-to-Drink (RTDs)",
  "Mixers & Soft Drinks",
],
```

### 3. `src/pages/auth/VendorSignup.tsx`

**Add Liquor Store option (around line 188):**
```tsx
{/* Inventory Categories */}
<SelectItem value="food-drinks">Food & Drinks</SelectItem>
<SelectItem value="living-essentials">Living Essentials</SelectItem>
<SelectItem value="groceries-food">Groceries & Food</SelectItem>
<SelectItem value="restaurant">Restaurant</SelectItem>
<SelectItem value="liquor-store">Liquor Store</SelectItem>  {/* NEW */}
```

### 4. `src/pages/vendor/CategoryManagement.tsx`

**Update INVENTORY_CATEGORIES constant (line 21-26):**
```typescript
const INVENTORY_CATEGORIES = [
  "Food & Drinks",
  "Living Essentials",
  "Groceries & Food",
  "Restaurant",
  "Liquor Store",  // NEW
] as const;
```

### 5. Database Trigger Update (SQL)

Update the trigger to include liquor-store mapping:

```sql
CREATE OR REPLACE FUNCTION public.assign_vendor_operational_category()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.operational_category := 'inventory';

  CASE NEW.business_type
    -- INVENTORY categories (5 - now includes Liquor Store)
    WHEN 'food-drinks' THEN NEW.operational_category := 'inventory';
    WHEN 'living-essentials' THEN NEW.operational_category := 'inventory';
    WHEN 'groceries-food' THEN NEW.operational_category := 'inventory';
    WHEN 'restaurant' THEN NEW.operational_category := 'inventory';
    WHEN 'liquor-store' THEN NEW.operational_category := 'inventory';

    -- SERVICE categories (2)
    WHEN 'utilities-services' THEN NEW.operational_category := 'service';
    WHEN 'home-services' THEN NEW.operational_category := 'service';

    -- BOOKING categories (2)
    WHEN 'beauty-spa' THEN NEW.operational_category := 'booking';
    WHEN 'accommodation' THEN NEW.operational_category := 'booking';

    -- PHARMACY (special hybrid type)
    WHEN 'pharmacy' THEN NEW.operational_category := 'pharmacy';
    
    -- Legacy fallbacks
    WHEN 'groceries-essentials' THEN NEW.operational_category := 'inventory';
    WHEN 'fashion-clothing' THEN NEW.operational_category := 'inventory';
    WHEN 'electronics-gadgets' THEN NEW.operational_category := 'inventory';
    WHEN 'minimart' THEN NEW.operational_category := 'inventory';
    WHEN 'repairs-maintenance' THEN NEW.operational_category := 'service';
    WHEN 'health-wellness' THEN NEW.operational_category := 'booking';
    ELSE NEW.operational_category := 'inventory';
  END CASE;

  RETURN NEW;
END;
$function$;
```

---

## Order Tracking - Already Configured

The `src/pages/OrderTracking.tsx` file already has proper messaging for "Liquor Store" category (lines 155-162):

```typescript
"Liquor Store": {
  icon: "🍷",
  preparingTitle: "Preparing your drinks",
  preparingDescription: "Your drinks are being prepared",
  notificationTitle: "Drinks Preparing! 🍷",
  timelineLabel: "Preparing Your Drinks",
  deliveredMessage: "Enjoy responsibly!",
},
```

No changes needed here - it's already properly configured!

---

## Final Category Count

After this change, the system will have **10 main categories**:

| # | Category | Type |
|---|----------|------|
| 1 | Food & Drinks | Inventory |
| 2 | Living Essentials | Inventory |
| 3 | Groceries & Food | Inventory |
| 4 | Restaurant | Inventory |
| 5 | **Liquor Store** | Inventory (NEW) |
| 6 | Utilities & Services | Service |
| 7 | Home Services | Service |
| 8 | Beauty & Spa | Booking |
| 9 | Accommodation | Booking |
| 10 | Pharmacy | Pharmacy (Hybrid) |

---

## Technical Notes

1. **business_type value**: Uses `liquor-store` (kebab-case) to match existing naming convention
2. **Category display name**: Uses "Liquor Store" (title case) for user-facing display
3. **Subcategory "Liquor" in Food & Drinks**: Allows food vendors to also sell alcohol without changing their main category
4. **Age restriction note**: The UI already handles Liquor Store with "(18+)" messaging where appropriate

