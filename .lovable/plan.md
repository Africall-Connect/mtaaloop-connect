
# Home.tsx + VendorHome.tsx Redesign Plan

## Overview

This plan addresses two major improvements:

1. **Home.tsx**: Add a dedicated "Pharmacy Consultations" section for booking health consultations
2. **VendorHome.tsx**: Stabilize and redesign the vendor page with working subcategory filtering, search, and theming

---

## Part 1: Add Pharmacy Consultation Section to Home.tsx

### Current State
- Home page has products, categories, minimarts, and MtaaLoop Essentials
- No pharmacy/consultation booking section exists

### Solution
Add a new themed section below the product grid that showcases pharmacy consultations with a CTA to book.

### New Section Design

```text
+----------------------------------------------------------+
|  [Stethoscope Icon]  Health & Consultation Services       |
|                                                          |
|  +------------+  +------------+  +------------+          |
|  | Pharmacy 1 |  | Pharmacy 2 |  | Pharmacy 3 |          |
|  | [Logo]     |  | [Logo]     |  | [Logo]     |          |
|  | Name       |  | Name       |  | Name       |          |
|  | [Book Now] |  | [Book Now] |  | [Book Now] |          |
|  +------------+  +------------+  +------------+          |
|                                                          |
|  [View All Pharmacies]  [My Consultations]               |
+----------------------------------------------------------+
```

### Implementation
- Add a new section after the product grid but before minimarts
- Fetch pharmacies that offer consultations (operational_category = 'pharmacy')
- Display pharmacy cards with gradient backgrounds matching the theme
- Each card has:
  - Pharmacy logo/placeholder
  - Business name
  - "Book Consultation" button that navigates to the pharmacy's page
- Bottom row has:
  - "View All Pharmacies" button (navigates to `/health`)
  - "My Consultations" button (navigates to `/my-consultations`)

---

## Part 2: VendorHome.tsx Redesign

### Current Problems

1. **Subcategory switching reloads the page**: Currently navigates to `/vendor/:slug/category/:categorySlug` which is a separate page (VendorCategory.tsx)
2. **White/plain design**: Minimal theming, doesn't match the vibrant MtaaLoop brand
3. **Search and filters don't work**: Input exists but has no functionality

### Solution

Consolidate everything into VendorHome.tsx with:
- Client-side subcategory filtering (no page reload)
- Working search functionality
- Working sort/filter options
- Themed design with gradients and brand colors

---

### Architecture Changes

**Before:**
```text
VendorHome.tsx → Loads all products
    ↓ Click subcategory
VendorCategory.tsx → Separate page, reloads data
```

**After:**
```text
VendorHome.tsx → Loads all products + handles filtering in-state
    ↓ Click subcategory
Same page, filters products client-side
```

---

### New VendorHome.tsx Structure

```text
+----------------------------------------------------------+
|  [Back] [Search Bar - WORKING]  [Cart] [Profile]          |
+----------------------------------------------------------+
|  [Logo]  Vendor Name                                      |
|          ★ 4.8 (120) • Location • Open • 30 min delivery |
+----------------------------------------------------------+
|  [Hero Banner with gradient overlay]                      |
|  "Welcome to {Vendor}"                                    |
|  "{Tagline}"                                              |
+----------------------------------------------------------+
|  [All] [Subcategory 1] [Subcategory 2] [Subcategory 3]   | <- NO page reload
+----------------------------------------------------------+
|  Sort: [Dropdown]  [Filters Button]                       |
+----------------------------------------------------------+
|  Showing X products in {Category}                         |
+----------------------------------------------------------+
|  +------+  +------+  +------+  +------+                  |
|  | Prod |  | Prod |  | Prod |  | Prod |                  |
|  +------+  +------+  +------+  +------+                  |
+----------------------------------------------------------+
```

---

### State Management for VendorHome.tsx

```typescript
// Existing state
const [vendor, setVendor] = useState<VendorWithProducts | null>(null);
const [products, setProducts] = useState<Product[]>([]);
const [subcategories, setSubcategories] = useState<...>([]);
const [loading, setLoading] = useState(true);

// NEW: Client-side filtering state
const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState("");
const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'newest'>('popular');

// Computed filtered products
const filteredProducts = useMemo(() => {
  let result = products;
  
  // Filter by subcategory
  if (selectedSubcategory) {
    result = result.filter(p => 
      p.subcategory === selectedSubcategory || 
      p.category === selectedSubcategory
    );
  }
  
  // Filter by search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }
  
  // Sort
  switch (sortBy) {
    case 'price-low': result.sort((a, b) => a.price - b.price); break;
    case 'price-high': result.sort((a, b) => b.price - a.price); break;
    case 'newest': result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
    case 'popular': 
    default: result.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0)); break;
  }
  
  return result;
}, [products, selectedSubcategory, searchQuery, sortBy]);
```

---

### VendorNavbar.tsx Changes

1. **Remove navigation on subcategory click**: Instead of navigating to `/vendor/:slug/category/:categorySlug`, call a callback prop
2. **Add search functionality**: Connect input to a callback prop
3. **Keep the same visual design** but pass the filter handlers

```typescript
interface VendorNavbarProps {
  vendor: ...;
  selectedSubcategory: string | null;
  onSubcategoryChange: (slug: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
```

---

### Theme Improvements for VendorHome.tsx

**Current**: Plain white background, minimal colors

**Updated**:
- Background gradient: `bg-gradient-to-br from-background via-primary/5 to-background`
- Hero banner: Full-width with vendor cover image + gradient overlay
- Category tabs: Primary color when active, subtle hover states
- Product cards: Enhanced shadows, hover animations, themed borders
- Section separators: Subtle gradient lines

---

### View Components Updates

The existing view components (InventoryView, PharmacyView, ServiceView, BookingView) will:
- Receive `filteredProducts` instead of `products`
- Not change their internal structure
- Work with the filtered data

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Home.tsx` | Add Pharmacy Consultation section |
| `src/pages/vendor/VendorHome.tsx` | Full redesign with client-side filtering, search, sort, theming |
| `src/components/vendor/VendorNavbar.tsx` | Make subcategory tabs call callback instead of navigate; connect search |
| `src/pages/vendor/views/InventoryView.tsx` | Minor theme updates (remove emoji placeholders) |

---

## Technical Details

### Home.tsx: Pharmacy Section

Add state and fetch:
```typescript
const [pharmacies, setPharmacies] = useState<VendorProfile[]>([]);

useEffect(() => {
  const fetchPharmacies = async () => {
    const { data } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('operational_category', 'pharmacy')
      .eq('is_approved', true)
      .eq('is_active', true)
      .limit(4);
    setPharmacies(data || []);
  };
  fetchPharmacies();
}, []);
```

Render section:
```tsx
{pharmacies.length > 0 && (
  <section className="mb-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-full">
        <Stethoscope className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg md:text-2xl font-bold">Health & Consultations</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Book pharmacy consultations
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {pharmacies.map(pharmacy => (
        <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
      ))}
    </div>
    
    <div className="flex gap-3 mt-4">
      <Button variant="outline" onClick={() => navigate('/health')}>
        View All Pharmacies
      </Button>
      <Button variant="outline" onClick={() => navigate('/my-consultations')}>
        My Consultations
      </Button>
    </div>
  </section>
)}
```

---

### VendorNavbar.tsx: Callback Pattern

Change from:
```tsx
onClick={() => navigate(`/vendor/${vendor.slug}/category/${category.slug}`)}
```

To:
```tsx
onClick={() => onSubcategoryChange(isAllProducts ? null : category.slug)}
```

---

### VendorHome.tsx: Themed Product Grid

Replace the plain view rendering with a themed wrapper:
```tsx
<div className="bg-gradient-to-br from-background via-primary/5 to-background min-h-screen">
  <VendorNavbar 
    vendor={vendor}
    selectedSubcategory={selectedSubcategory}
    onSubcategoryChange={setSelectedSubcategory}
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
  />
  
  {/* Hero Banner */}
  <div className="relative h-48 md:h-64 overflow-hidden">
    <img src={vendor.cover_image_url} className="..." />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
    <div className="absolute bottom-4 left-6">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg">...</h1>
    </div>
  </div>
  
  {/* Filters Bar */}
  <div className="sticky top-[var(--navbar-height)] z-30 bg-background/95 backdrop-blur border-b px-6 py-3">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {filteredProducts.length} products {selectedSubcategory ? `in ${selectedSubcategory}` : ''}
      </p>
      <div className="flex items-center gap-3">
        <Select value={sortBy} onValueChange={setSortBy}>...</Select>
      </div>
    </div>
  </div>
  
  {/* Products */}
  <div className="px-6 py-8">
    {vendor.operational_category === 'inventory' && <InventoryView products={filteredProducts} />}
    {vendor.operational_category === 'pharmacy' && <PharmacyView products={filteredProducts} />}
    ...
  </div>
</div>
```

---

## Summary

| Issue | Solution |
|-------|----------|
| No pharmacy booking in Home.tsx | Add themed section with pharmacy cards and booking CTAs |
| Subcategory causes page reload | Move filtering to VendorHome.tsx state, use callbacks |
| Plain white vendor page | Add gradients, themed colors, better card styling |
| Search bar doesn't work | Connect to state, filter products client-side |
| Sort/filters don't work | Add sortBy state with useMemo filtering |

---

## Mobile Responsiveness

All changes maintain:
- 44px minimum touch targets
- 2-column grids on mobile, 4-column on desktop
- Horizontal scroll with snap for category tabs
- Sticky navigation elements
- Safe area padding for notched phones
