
# Fix Category Pages: Database Fetching for All 10 Official Categories

## Problem Summary

1. **The `/categories/liquor-store` route is empty** - The dynamic `[category].tsx` page queries `vendor_profiles` by `business_type` or `category` fields, but vendors may be categorized through the `vendor_categories` table instead.

2. **The working `/liquor-db` page** uses a different approach - it queries through `vendor_categories` table first, then gets vendor profiles.

3. **The current `[category].tsx`** only looks at `vendor_profiles.business_type` and `vendor_profiles.category` columns, missing vendors that are categorized via the `vendor_categories` join table.

## Solution

Rewrite the `src/pages/categories/[category].tsx` file to use the same database-fetching pattern as `Liquor2.tsx`:

1. Query `vendor_categories` table to find vendors in the category
2. Then fetch `vendor_profiles` for those vendors
3. Also query `vendor_subcategories` to group by subcategory

## Files to Modify

| File | Purpose |
|------|---------|
| `src/pages/categories/[category].tsx` | Rewrite to use `vendor_categories` table pattern like `Liquor2.tsx` |

## Detailed Changes

### Rewrite `[category].tsx` Fetch Logic

**Current Approach (not working):**
```typescript
const { data: vendorData } = await supabase
  .from('vendor_profiles')
  .select(...)
  .or(`business_type.eq.${slug},category.eq.${categoryName}`)
```

**New Approach (following Liquor2.tsx pattern):**
```typescript
// Step 1: Get category entries from vendor_categories
const { data: categories } = await supabase
  .from('vendor_categories')
  .select('id, vendor_id')
  .eq('name', categoryName)  // e.g., "Liquor Store"
  .eq('is_active', true);

// Step 2: Get vendor profiles for those vendors
const vendorIds = categories?.map(c => c.vendor_id) || [];
const { data: vendors } = await supabase
  .from('vendor_profiles')
  .select('id, business_name, slug, logo_url, cover_image_url, tagline, rating, delivery_time, delivery_fee, is_open')
  .in('id', vendorIds)
  .eq('is_approved', true)
  .eq('is_active', true);

// Step 3: Get subcategories for grouping
const categoryIds = categories?.map(c => c.id) || [];
const { data: subcategories } = await supabase
  .from('vendor_subcategories')
  .select('id, name, vendor_id, category_id')
  .in('category_id', categoryIds)
  .eq('is_active', true);

// Step 4: Group vendors by subcategory
```

### Add Fallback Query

Also query `vendor_profiles.business_type` as a fallback for vendors who haven't set up the `vendor_categories` table:

```typescript
// Fallback: Also get vendors by business_type column
const { data: businessTypeVendors } = await supabase
  .from('vendor_profiles')
  .select('...')
  .eq('business_type', businessTypeSlug)  // e.g., "liquor-store"
  .eq('is_approved', true)
  .eq('is_active', true);

// Merge results, avoiding duplicates
const allVendorIds = new Set([...vendorIds, ...(businessTypeVendors?.map(v => v.id) || [])]);
```

### Category Name to Emoji/Icon Mapping

Add a mapping for category-specific icons to display in vendor cards:

```typescript
const categoryEmojis: Record<string, string> = {
  'Food & Drinks': '🍔',
  'Living Essentials': '🧴',
  'Groceries & Food': '🥬',
  'Restaurant': '🍽️',
  'Liquor Store': '🍺',
  'Utilities & Services': '💧',
  'Home Services': '🏠',
  'Beauty & Spa': '💅',
  'Accommodation': '🏨',
  'Pharmacy': '💊',
};
```

### Update Hero Banner Images

Add missing category images to the `categoryImages` mapping:

```typescript
const categoryImages: Record<string, string> = {
  'Food & Drinks': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop',
  'Living Essentials': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=1200&h=600&fit=crop',
  'Groceries & Food': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=600&fit=crop',
  'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop',
  'Liquor Store': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&h=600&fit=crop',
  'Utilities & Services': 'https://images.unsplash.com/photo-1585687433448-e0d7cba3c0a5?w=1200&h=600&fit=crop',
  'Home Services': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=600&fit=crop',
  'Beauty & Spa': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop',
  'Accommodation': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop',
  'Pharmacy': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=600&fit=crop',
};
```

## Complete Rewritten Fetch Function

```typescript
const fetchVendors = React.useCallback(async () => {
  try {
    setLoading(true);

    const businessTypeSlug = category || '';
    
    // Method 1: Query via vendor_categories table
    const { data: categoryEntries, error: catError } = await supabase
      .from('vendor_categories')
      .select('id, vendor_id')
      .eq('name', categoryName)
      .eq('is_active', true);

    if (catError) console.error('Category fetch error:', catError);

    const categoryVendorIds = categoryEntries?.map(c => c.vendor_id) || [];
    const categoryIds = categoryEntries?.map(c => c.id) || [];

    // Method 2: Query by business_type (fallback)
    const { data: businessTypeVendors, error: btError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, slug, logo_url, cover_image_url, tagline, rating, delivery_time, delivery_fee, is_open, latitude, longitude, total_orders, business_description, operational_category')
      .eq('business_type', businessTypeSlug)
      .eq('is_approved', true)
      .eq('is_active', true);

    if (btError) console.error('Business type fetch error:', btError);

    // Combine vendor IDs from both methods
    const businessTypeVendorIds = businessTypeVendors?.map(v => v.id) || [];
    const allVendorIds = [...new Set([...categoryVendorIds, ...businessTypeVendorIds])];

    if (allVendorIds.length === 0) {
      setVendors([]);
      setSubcategoryGroups([]);
      setVendorsWithoutSub([]);
      setLoading(false);
      return;
    }

    // Fetch full vendor profiles for category vendors
    let categoryVendorProfiles: Vendor[] = [];
    if (categoryVendorIds.length > 0) {
      const { data: catVendors } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, slug, logo_url, cover_image_url, tagline, rating, delivery_time, delivery_fee, is_open, latitude, longitude, total_orders, business_description, operational_category')
        .in('id', categoryVendorIds)
        .eq('is_approved', true)
        .eq('is_active', true);
      
      categoryVendorProfiles = catVendors || [];
    }

    // Merge vendors from both sources
    const vendorMap = new Map<string, Vendor>();
    [...categoryVendorProfiles, ...(businessTypeVendors || [])].forEach(v => {
      if (!vendorMap.has(v.id)) {
        vendorMap.set(v.id, transformVendor(v));
      }
    });
    
    const allVendors = Array.from(vendorMap.values());

    // Get subcategories for grouping
    if (categoryIds.length > 0) {
      const { data: subcategories } = await supabase
        .from('vendor_subcategories')
        .select('id, name, vendor_id, category_id')
        .in('category_id', categoryIds)
        .eq('is_active', true);

      // Group vendors by subcategory
      const subGroups: { [key: string]: Vendor[] } = {};
      const vendorsWithSub = new Set<string>();

      subcategories?.forEach(sub => {
        const vendor = allVendors.find(v => v.id === sub.vendor_id);
        if (vendor) {
          if (!subGroups[sub.name]) {
            subGroups[sub.name] = [];
          }
          subGroups[sub.name].push(vendor);
          vendorsWithSub.add(vendor.id);
        }
      });

      const groupsArray = Object.entries(subGroups).map(([subcategory, vendors]) => ({
        subcategory,
        vendors,
      }));

      const withoutSub = allVendors.filter(v => !vendorsWithSub.has(v.id));

      setSubcategoryGroups(groupsArray);
      setVendorsWithoutSub(withoutSub);
    } else {
      setSubcategoryGroups([]);
      setVendorsWithoutSub(allVendors);
    }

    setVendors(allVendors);
  } catch (error) {
    console.error('Error loading vendors:', error);
    setVendors([]);
    setSubcategoryGroups([]);
    setVendorsWithoutSub([]);
  } finally {
    setLoading(false);
  }
}, [categoryName, category, customerLocation]);
```

## Summary

| Before | After |
|--------|-------|
| Only queries `vendor_profiles.business_type` | Queries `vendor_categories` table + fallback to `business_type` |
| No subcategory grouping | Groups vendors by subcategories from `vendor_subcategories` |
| Missing category banner images | All 10 categories have banner images |
| No category-specific emoji | Category-specific emojis for vendor cards |

## Result

After this change:
- `/categories/liquor-store` will show vendors from `vendor_categories` where `name = 'Liquor Store'`
- All 10 category pages will work correctly
- Vendors will be grouped by subcategories when available
- Fallback to `business_type` ensures backward compatibility
