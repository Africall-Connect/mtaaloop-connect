
# Category & Subcategory Restructuring Plan

## ✅ COMPLETED

The category restructuring has been implemented as of the approved plan.

---

## New Category Structure (Implemented)

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

---

## Files Modified

1. ✅ `src/types/database.ts` - Added 'pharmacy' to operational_category type
2. ✅ `src/lib/categories.ts` - Complete rewrite with new 9-category structure
3. ✅ `src/constants/categories.ts` - Mirrored new structure
4. ✅ `src/pages/vendor/CategoryManagement.tsx` - Updated with new arrays + Restaurant custom input
5. ✅ `src/pages/auth/VendorSignup.tsx` - Reduced to 9 business type options

---

## Data Migration Strategy (Recommended: Soft Migration)

Existing vendor data in `vendor_categories` and `vendor_subcategories` tables remains untouched:
- Old categories stay in the database
- Existing vendors continue using their categories
- New vendors see the streamlined 9-category options
- Run cleanup scripts later if needed

### Optional Hard Migration SQL (if needed later):
```sql
-- Deactivate legacy categories no longer in the new structure
UPDATE vendor_categories SET is_active = false 
WHERE name NOT IN (
  'Food & Drinks', 'Living Essentials', 'Groceries & Food', 'Restaurant',
  'Utilities & Services', 'Home Services', 'Beauty & Spa', 'Accommodation', 'Pharmacy'
);
```
