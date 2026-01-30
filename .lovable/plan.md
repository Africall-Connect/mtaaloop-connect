

# Home Page Redesign Plan

## Overview

This redesign transforms the Home page from a category-centric layout to a **product-first marketplace** inspired by Greenspoon's design. The key changes are:

1. **Replace Vendor Spotlight** with a Featured Product Banner (eBay-style)
2. **Replace Category Grid** with a horizontal category navigation + product grid
3. Keep the same visual theme and mobile-first approach

---

## Design Changes

### 1. Featured Product Banner (Replacing Spotlight)

Instead of cycling through vendors, display a **randomly selected product** with a compelling "Shop Now" CTA:

```text
+----------------------------------------------------------+
|  [Product Image - Full Width Banner]                      |
|                                                          |
|  "Today's Pick"                                           |
|  Fresh Mango Juice - 1L                                  |
|  KES 250                                                 |
|                                                          |
|  [Shop Now]  [See More Like This]                        |
+----------------------------------------------------------+
```

**Features:**
- Randomly picks a product from available products
- Auto-rotates every 8 seconds
- Shows product image, name, price, vendor name
- "Shop Now" adds to cart, "See More" goes to vendor page
- Compact height on mobile (180px), taller on desktop (280px)

### 2. Horizontal Category Tabs (Replacing Category Grid)

A sticky horizontal scrollable category bar with filter chips:

```text
[All] [Food & Drinks] [Groceries] [Pharmacy] [Beauty] [Home] ...
```

**Features:**
- Horizontal scroll with snap behavior
- Active category highlighted
- Sticky below header on scroll (optional)
- Includes priority categories: Trash Collection, Quick Services

### 3. Product Grid Layout

Products displayed in a compact grid directly below category tabs:

```text
+--------+  +--------+  +--------+  +--------+
|  IMG   |  |  IMG   |  |  IMG   |  |  IMG   |
|--------|  |--------|  |--------|  |--------|
| Name   |  | Name   |  | Name   |  | Name   |
| KES XX |  | KES XX |  | KES XX |  | KES XX |
| Vendor |  | Vendor |  | Vendor |  | Vendor |
| [+]    |  | [+]    |  | [+]    |  | [+]    |
+--------+  +--------+  +--------+  +--------+
```

**Features:**
- 2 columns on mobile, 3-4 on desktop
- Compact cards with product image, name, price, vendor tag
- Quick add-to-cart button
- Category and vendor badge overlay
- Filter by selected category tab

---

## New Components to Create

### 1. `FeaturedProductBanner.tsx`

A banner component that:
- Fetches a random product from the database
- Displays with attractive gradient overlay
- Auto-rotates through featured products
- Shows "Shop Now" CTA

### 2. `CategoryTabsNav.tsx`

Horizontal category navigation:
- Fetches categories from database
- Horizontal scroll with active state
- onClick filters the product grid
- Always includes Trash Collection and Quick Services

### 3. `HomeProductGrid.tsx`

Product grid component:
- Accepts filtered products
- Compact card design (similar to Index.tsx CompactProductCard)
- Add to cart functionality
- Shows vendor name badge

---

## Data Flow

```text
Home.tsx
  |
  ├── Fetch products with vendor info (like Index.tsx)
  |     FROM products
  |     JOIN vendor_profiles
  |     WHERE is_available = true
  |           AND vendor is_approved/is_active
  |
  ├── Extract unique categories from products
  |
  ├── State: selectedCategory (null = all)
  |
  ├── Filter products by selectedCategory
  |
  └── Render:
        ├── FeaturedProductBanner (random product)
        ├── CategoryTabsNav (category filters)
        └── HomeProductGrid (filtered products)
```

---

## Layout Structure

```text
+------------------------------------------+
|  Header (unchanged)                       |
+------------------------------------------+
|  Welcome + Search (unchanged, compact)    |
+------------------------------------------+
|  Featured Product Banner                  |
|  (Random product - "Shop Now")           |
+------------------------------------------+
|  [All] [Food] [Groceries] [Pharmacy]...  |  <- Category Tabs
+------------------------------------------+
|  "Showing 24 products in Food & Drinks"  |
+------------------------------------------+
|  +------+  +------+  +------+  +------+  |
|  | Prod |  | Prod |  | Prod |  | Prod |  |
|  +------+  +------+  +------+  +------+  |
|  +------+  +------+  +------+  +------+  |
|  | Prod |  | Prod |  | Prod |  | Prod |  |
|  +------+  +------+  +------+  +------+  |
+------------------------------------------+
|  Load More / Infinite Scroll              |
+------------------------------------------+
|  MtaaLoop Essentials (keep as is)         |
+------------------------------------------+
```

---

## Files to Modify/Create

| Action | File | Description |
|--------|------|-------------|
| Create | `src/components/home/FeaturedProductBanner.tsx` | Random product banner with CTA |
| Create | `src/components/home/CategoryTabsNav.tsx` | Horizontal category filter tabs |
| Create | `src/components/home/HomeProductCard.tsx` | Compact product card for grid |
| Create | `src/components/home/HomeProductGrid.tsx` | Grid layout for products |
| Modify | `src/pages/Home.tsx` | Refactor to use new components |
| Delete | N/A | VendorSpotlight import removed (component kept for other uses) |

---

## Technical Details

### Product Fetching (in Home.tsx)

```typescript
// Fetch products with vendor info
const { data } = await supabase
  .from("products")
  .select(`
    id, name, description, category, subcategory, 
    price, image_url, is_available, vendor_id,
    vendor_profiles!inner (
      id, business_name, slug, is_approved, is_active
    )
  `)
  .eq("is_available", true)
  .eq("vendor_profiles.is_approved", true)
  .eq("vendor_profiles.is_active", true)
  .order("name", { ascending: true })
  .limit(50);
```

### Category Extraction

```typescript
// Extract unique categories from products
const categories = useMemo(() => {
  const cats = new Set<string>();
  products.forEach(p => cats.add(p.category));
  return Array.from(cats).sort();
}, [products]);
```

### Featured Product Selection

```typescript
// Pick random product, refresh every 8s
const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);

useEffect(() => {
  if (products.length === 0) return;
  
  const pickRandom = () => {
    const idx = Math.floor(Math.random() * products.length);
    setFeaturedProduct(products[idx]);
  };
  
  pickRandom();
  const interval = setInterval(pickRandom, 8000);
  return () => clearInterval(interval);
}, [products]);
```

---

## Mobile Responsiveness

| Element | Mobile | Desktop |
|---------|--------|---------|
| Featured Banner | 180px height | 280px height |
| Category Tabs | Horizontal scroll | Horizontal scroll (wider) |
| Product Grid | 2 columns | 4 columns |
| Product Card | Compact (image 4:3) | Slightly larger |
| Welcome Section | Single line | Multi-line with subtitle |

---

## Sections Retained

The following sections remain unchanged:
- **Header** (logo, location, cart, profile)
- **Search bar**
- **Location Info Bar**
- **Minimarts in Your Area** (if data exists)
- **MtaaLoop Essentials** (MtaaLoop Mart card)
- **Popular Vendors Near You** (optional, can be removed if redundant)
- **Apartment Switcher Modal**

---

## Visual Theme

Keeping the current theme:
- Primary color accents
- Card-based design with shadows on hover
- Gradient overlays for featured banner
- White/light background with muted section backgrounds
- Mobile-first touch targets (min 44px)

---

## Summary

| Before | After |
|--------|-------|
| Vendor Spotlight (carousel) | Featured Product Banner (random product) |
| "What are you looking for?" category grid | Horizontal category tabs |
| Category cards with images | Product grid with category filter |
| Vendor-centric | Product-centric |

This redesign makes the homepage more **product-focused** and **action-oriented**, similar to Greenspoon's approach where users see actual products immediately rather than navigating through categories first.

