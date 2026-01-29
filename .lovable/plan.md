
# Category & Subcategory Restructuring Plan

## Overview

This plan restructures the category system from 30+ scattered categories down to a focused set of 9 main categories organized by operational type (Inventory, Service, Booking, Pharmacy). The changes affect multiple files and require a migration strategy for existing data.

---

## New Category Structure

### Inventory Categories (4)
| Category | Subcategories |
|----------|---------------|
| **Food & Drinks** | Fast Food, Traditional Food, Cafes & Coffee Shops, Bakery & Pastries, International Cuisine, Pizza, Burgers & Sandwiches, Chicken & Wings, Seafood, Vegetarian & Vegan, Juice Bar & Smoothies, Ice Cream |
| **Living Essentials** | Toiletries & Personal Hygiene, Skincare & Grooming, Health & First Aid, Cleaning Supplies, Household Essentials |
| **Groceries & Food** | Fresh Produce, Fruits, Vegetables, Meat & Poultry, Fish, Dairy & Eggs, Bread & Bakery, Snacks & Confectionery |
| **Restaurant** | *User-defined* (vendors create their own subcategories) |

### Service Categories (2)
| Category | Subcategories |
|----------|---------------|
| **Utilities & Services** | Gas Delivery, Water Delivery |
| **Home Services** | Cleaning Services, Laundry Services, Electrical |

### Booking Categories (2)
| Category | Subcategories |
|----------|---------------|
| **Beauty & Spa** | Hair Salon, Barber, Nail Salon, Massage, Facial, Makeup Service, Bridal Package |
| **Accommodation** | Guest Houses, Airbnb, Rentals |

### Special Category - Pharmacy (1)
| Category | Subcategories |
|----------|---------------|
| **Pharmacy** | Consultation (booking), Prescription Medicine, Over-the-Counter Medicine, Family Planning, First Aid Supplies, Vitamins & Supplements, Baby Care, Personal Hygiene, Medical Devices |

*Pharmacy is special because it mixes inventory (products) with booking (consultations).*

---

## Files to Modify

### 1. `src/lib/categories.ts` (Primary source of truth)
Replace all existing categories with the new reduced set:
- Update `INVENTORY_CATEGORIES` array (4 items)
- Update `SERVICE_CATEGORIES` array (2 items)
- Update `BOOKING_CATEGORIES` array (2 items)
- Add `PHARMACY_CATEGORIES` array (1 item - special hybrid)
- Update `MAIN_CATEGORIES` array (9 items total)
- Replace `SUBCATEGORY_OPTIONS` object with new subcategory mappings

### 2. `src/constants/categories.ts` (Secondary source)
Mirror the same changes as `src/lib/categories.ts` to maintain consistency.

### 3. `src/pages/vendor/CategoryManagement.tsx`
- Update the inline `INVENTORY_CATEGORIES`, `SERVICE_CATEGORIES`, `BOOKING_CATEGORIES` constants (lines 21-58)
- Add handling for the new `PHARMACY_CATEGORIES` operational type
- Update `getAvailableCategories()` function to include pharmacy logic

### 4. `src/pages/auth/VendorSignup.tsx`
Update the business type dropdown (lines 184-215) to show only the new reduced categories:
- Food & Drinks
- Living Essentials
- Groceries & Food
- Restaurant
- Utilities & Services
- Home Services
- Beauty & Spa
- Accommodation
- Pharmacy

### 5. `src/types/database.ts`
Add 'pharmacy' to the `operational_category` union type (line 49):
```typescript
operational_category: 'inventory' | 'service' | 'booking' | 'pharmacy' | null;
```

---

## Handling Existing Data (Migration Strategy)

Your database tables `vendor_categories` and `vendor_subcategories` store vendor-specific categories. Here are your options for handling existing data:

### Option A: Soft Migration (Recommended)
1. **Keep existing data** - Old categories remain in the database
2. **New vendors** get the new reduced category options
3. **Existing vendors** can still see and use their old categories
4. **Add a mapping table** or flag to indicate "legacy" categories

This is the safest approach and requires no immediate database changes.

### Option B: Hard Migration
1. Create a category mapping from old to new:
   - "Groceries & Essentials" -> "Groceries & Food"
   - "Fashion & Clothing" -> Remove or archive
   - "Electronics & Gadgets" -> Remove or archive
   - etc.

2. Run SQL update scripts:
```sql
-- Example: Migrate "Groceries & Essentials" to "Groceries & Food"
UPDATE vendor_categories 
SET name = 'Groceries & Food', slug = 'groceries-food' 
WHERE name = 'Groceries & Essentials';

-- For categories being removed, you have two options:
-- Option 1: Deactivate them
UPDATE vendor_categories SET is_active = false 
WHERE name IN ('Fashion & Clothing', 'Electronics & Gadgets', ...);

-- Option 2: Delete them (WARNING: cascades to products)
-- Only if you're sure vendors don't have products in these categories
```

### Recommendation

Go with **Option A (Soft Migration)** for now:
- No immediate database changes required
- Existing vendors continue working normally
- New vendors see the streamlined options
- You can run cleanup scripts later when convenient

---

## Implementation Sequence

1. Update `src/types/database.ts` to add 'pharmacy' type
2. Update `src/lib/categories.ts` with new category structure
3. Update `src/constants/categories.ts` to match
4. Update `src/pages/vendor/CategoryManagement.tsx` with new arrays
5. Update `src/pages/auth/VendorSignup.tsx` dropdown options
6. Test vendor signup flow with new categories
7. Test category management for new vendors

---

## Technical Notes

### Restaurant Category - User-Defined Subcategories
For the "Restaurant" category, the subcategory options array will be empty (`[]`), and the UI in CategoryManagement.tsx will be modified to:
- Show a text input instead of a dropdown when "Restaurant" is the parent category
- Allow vendors to type their own custom subcategory names

### Pharmacy - Hybrid Category
Pharmacy will have a special `operational_category` value of `'pharmacy'` that enables:
- Inventory products (medicines, supplies)
- Booking services (consultations)
- Mixed product types in the same vendor store

This requires adding `'pharmacy'` to the operational_category enum and handling it in `VendorHome.tsx` to show both inventory and booking views.

