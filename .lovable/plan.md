
# Home Page Categories: Data Filtering and Route Fixes

## Problem Summary

1. **Categories without data**: The "What are you looking for?" section shows all 11 categories, even those that may have no vendors/products
2. **404 errors**: Clicking on categories like `/living-essentials`, `/groceries-food`, `/liquor-store`, `/utilities-services`, `/restaurant`, `/accommodation` leads to 404 because no routes exist for these paths
3. **Inconsistent routing**: Some categories use static pages (`/food-drinks`), some use database pages (`/food-drinks-db`), and the dynamic route (`/categories/:category`) exists but is not being used by Home.tsx

## Solution Overview

### Part 1: Add Missing Routes to App.tsx

Add routes for all 10 official categories that point to the dynamic `CategoryPage` component, which already has the logic to fetch vendors by category name.

| Category Link | Route to Add |
|---------------|--------------|
| `/living-essentials` | CategoryPage |
| `/groceries-food` | CategoryPage |
| `/restaurant` | CategoryPage |
| `/liquor-store` | CategoryPage |
| `/utilities-services` | CategoryPage |
| `/beauty-spa` | (already exists, but static) → CategoryPage |
| `/accommodation` | CategoryPage |
| `/pharmacy` | (needs new route) → CategoryPage |

### Part 2: Update CategoryPage Slug Mapping

The `src/pages/categories/[category].tsx` file has a `slugToCategoryName` function that needs to include all 10 categories:

```typescript
const slugToCategoryName = (slug: string | undefined): string => {
  if (!slug) return '';
  const mapping: Record<string, string> = {
    // Current mappings
    'food-drinks': 'Food & Drinks',
    'shopping': 'Shopping',
    'health-wellness': 'Health & Wellness',
    'beauty-spa': 'Beauty & Spa',
    'home-services': 'Home Services',
    'transport-car': 'Transport & Car',
    'living-essentials': 'Living Essentials',
    'special-occasions': 'Special Occasions',
    // NEW mappings to add
    'groceries-food': 'Groceries & Food',
    'restaurant': 'Restaurant',
    'liquor-store': 'Liquor Store',
    'utilities-services': 'Utilities & Services',
    'accommodation': 'Accommodation',
    'pharmacy': 'Pharmacy',
  };
  return mapping[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
```

### Part 3: Update Home.tsx Category Links

Change the category links in Home.tsx to use the dynamic route pattern `/categories/:category` instead of the flat routes:

| Current Link | New Link |
|--------------|----------|
| `/food-drinks` | `/categories/food-drinks` |
| `/living-essentials` | `/categories/living-essentials` |
| `/groceries-food` | `/categories/groceries-food` |
| `/restaurant` | `/categories/restaurant` |
| `/liquor-store` | `/categories/liquor-store` |
| `/utilities-services` | `/categories/utilities-services` |
| `/home-services` | `/categories/home-services` |
| `/beauty-spa` | `/categories/beauty-spa` |
| `/accommodation` | `/categories/accommodation` |
| `/pharmacy` | `/categories/pharmacy` |

### Part 4: Filter Categories to Only Show Those with Data

Add a database query to check which categories have vendors, then filter the displayed categories:

```typescript
// In Home.tsx
const [categoriesWithData, setCategoriesWithData] = useState<string[]>([]);

useEffect(() => {
  const fetchCategoriesWithData = async () => {
    // Get distinct category names from vendor_categories that have active vendors
    const { data } = await supabase
      .from('vendor_categories')
      .select('name, vendor_profiles!inner(is_approved, is_active)')
      .eq('vendor_profiles.is_approved', true)
      .eq('vendor_profiles.is_active', true);
    
    if (data) {
      const uniqueCategories = [...new Set(data.map(d => d.name))];
      setCategoriesWithData(uniqueCategories);
    }
  };
  
  fetchCategoriesWithData();
}, []);

// Filter categories to only show those with data (+ always show Trash Collection)
const displayedCategories = categories.filter(cat => 
  categoriesWithData.includes(cat.name) || cat.name === "Trash Collection"
);
```

### Part 5: Update CategoryPage to Fetch from Database

The current `CategoryPage` uses static vendor data from `src/data/vendors.ts`. Update it to query `vendor_categories` and `vendor_profiles` from the database instead.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Home.tsx` | 1. Update category links to use `/categories/` prefix. 2. Add state + useEffect to fetch categories with data. 3. Filter displayed categories |
| `src/pages/categories/[category].tsx` | 1. Add missing slug mappings. 2. Update fetch logic to query database instead of static data |
| `src/App.tsx` | Clean up old static category routes (optional) |

---

## Detailed Implementation

### Step 1: Update Home.tsx Category Links

Change all category links from flat paths to dynamic route pattern:

```typescript
const categories = [
  {
    icon: UtensilsCrossed,
    name: "Food & Drinks",
    subtitle: "Fast Food, Traditional, Cafes & More",
    link: "/categories/food-drinks",  // Changed from "/food-drinks"
    gradient: "from-orange-500 to-red-500",
    image: "..."
  },
  // ... update all other categories similarly
];
```

### Step 2: Add Category Data Filtering in Home.tsx

```typescript
const [categoriesWithData, setCategoriesWithData] = useState<string[]>([]);
const [loadingCategories, setLoadingCategories] = useState(true);

useEffect(() => {
  const fetchCategoriesWithVendors = async () => {
    try {
      // Query vendor_categories joined with vendor_profiles to find categories that have active vendors
      const { data, error } = await supabase
        .from('vendor_categories')
        .select(`
          name,
          vendor_id,
          vendor_profiles!inner(is_approved, is_active)
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Also check business_type from vendor_profiles for vendors without categories table entries
      const { data: vendorData } = await supabase
        .from('vendor_profiles')
        .select('business_type, category')
        .eq('is_approved', true)
        .eq('is_active', true);

      // Map business_type slugs to category names
      const businessTypeToCategory: Record<string, string> = {
        'food-drinks': 'Food & Drinks',
        'living-essentials': 'Living Essentials',
        'groceries-food': 'Groceries & Food',
        'restaurant': 'Restaurant',
        'liquor-store': 'Liquor Store',
        'utilities-services': 'Utilities & Services',
        'home-services': 'Home Services',
        'beauty-spa': 'Beauty & Spa',
        'accommodation': 'Accommodation',
        'pharmacy': 'Pharmacy',
      };

      const categoriesFromVendorCategories = data?.map(d => d.name) || [];
      const categoriesFromBusinessType = vendorData?.map(v => 
        businessTypeToCategory[v.business_type] || v.category
      ).filter(Boolean) || [];

      const allCategories = [...new Set([
        ...categoriesFromVendorCategories,
        ...categoriesFromBusinessType
      ])];

      setCategoriesWithData(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // On error, show all categories as fallback
      setCategoriesWithData(categories.map(c => c.name));
    } finally {
      setLoadingCategories(false);
    }
  };

  fetchCategoriesWithVendors();
}, []);

// Filter to only show categories with data
const displayedCategories = categories.filter(cat => 
  categoriesWithData.includes(cat.name) || 
  cat.name === "Trash Collection" // Always show Trash Collection
);
```

### Step 3: Update CategoryPage Slug Mapping

In `src/pages/categories/[category].tsx`, update the mapping:

```typescript
const slugToCategoryName = (slug: string | undefined): string => {
  if (!slug) return '';
  const mapping: Record<string, string> = {
    'food-drinks': 'Food & Drinks',
    'living-essentials': 'Living Essentials',
    'groceries-food': 'Groceries & Food',
    'restaurant': 'Restaurant',
    'liquor-store': 'Liquor Store',
    'utilities-services': 'Utilities & Services',
    'home-services': 'Home Services',
    'beauty-spa': 'Beauty & Spa',
    'accommodation': 'Accommodation',
    'pharmacy': 'Pharmacy',
    // Legacy mappings for backward compatibility
    'shopping': 'Shopping',
    'health-wellness': 'Health & Wellness',
    'transport-car': 'Transport & Car',
    'special-occasions': 'Special Occasions',
  };
  return mapping[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
```

### Step 4: Update CategoryPage to Query Database

Replace the static vendor data fetch with database queries:

```typescript
const fetchVendors = React.useCallback(async () => {
  try {
    setLoading(true);

    // Query vendors that match this category
    // Option 1: Via vendor_categories table
    const { data: categoryMatches } = await supabase
      .from('vendor_categories')
      .select(`
        vendor_id,
        vendor_subcategories(name)
      `)
      .eq('name', categoryName)
      .eq('is_active', true);

    // Option 2: Via vendor_profiles.business_type
    const businessTypeSlug = category; // e.g., "food-drinks"
    
    const { data: vendors } = await supabase
      .from('vendor_profiles')
      .select(`
        id, business_name, slug, logo_url, cover_image_url, 
        tagline, rating, delivery_time, delivery_fee, is_open,
        latitude, longitude
      `)
      .eq('is_approved', true)
      .eq('is_active', true)
      .or(`business_type.eq.${businessTypeSlug},category.eq.${categoryName}`)
      .order('rating', { ascending: false });

    // ... rest of processing
  } catch (error) {
    console.error('Error loading vendors:', error);
  } finally {
    setLoading(false);
  }
}, [categoryName, category]);
```

---

## Summary of Changes

| Change | Purpose |
|--------|---------|
| Update Home.tsx category links | Use dynamic route `/categories/food-drinks` instead of static `/food-drinks` |
| Add category filtering in Home.tsx | Only show categories that have vendors with products |
| Update CategoryPage slug mapping | Map all 10 official category slugs to their display names |
| Update CategoryPage fetch logic | Query database instead of static vendor data |
| Keep Trash Collection always visible | Special service that should always be accessible |

---

## After Implementation

1. Categories without vendor data will be hidden from the Home page
2. Clicking any category will navigate to `/categories/{slug}` which works
3. The CategoryPage will show vendors from the database for that category
4. Trash Collection remains always visible as a special service
