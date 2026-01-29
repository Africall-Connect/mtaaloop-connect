
# Landing Page Redesign: E-Commerce Marketplace Style

## Overview

Transform the Index.tsx landing page from an informational page with multiple sections (HeroSection, ProblemSection, HowItWorksSection, SocialProof, GuaranteeSection, FinalCTA) into a product-first marketplace experience similar to Jumia/Amazon, while maintaining the Mtaaloop branding and style.

## What You'll Get

A clean, product-focused landing page that:
- Shows a simple header with navigation and cart
- Displays all products from the database grouped by category and subcategory
- Allows filtering by category and subcategory with tabs/chips
- Orders products alphabetically: Category Name > Subcategory Name > Product Name
- Only shows categories that actually have products in the database
- Maintains the footer for navigation

---

## Part 1: Page Structure

### New Layout

```text
+--------------------------------------------------+
| HEADER (logo, search, cart, login/account)       |
+--------------------------------------------------+
| CATEGORY FILTERS (horizontal scrollable chips)   |
+--------------------------------------------------+
| SUBCATEGORY TABS (when category selected)        |
+--------------------------------------------------+
| PRODUCTS GRID (sorted alphabetically)            |
|                                                  |
|  [Product] [Product] [Product] [Product]         |
|  [Product] [Product] [Product] [Product]         |
|  [Product] [Product] [Product] ...               |
+--------------------------------------------------+
| FOOTER                                           |
+--------------------------------------------------+
```

### Components to Keep
- **Footer**: Keep the existing Footer component for partner links, contact info, and legal

### Components to Remove
- HeroSection
- ProblemSection
- HowItWorksSection
- SocialProof
- GuaranteeSection
- FinalCTA
- LiveActivityFeed
- SectionSeparator

---

## Part 2: New Header Design

A compact, e-commerce focused header:

| Element | Description |
|---------|-------------|
| **Logo** | Mtaaloop logo (h-10) + "Mtaaloop" text |
| **Search** | Prominent search bar for products |
| **Cart** | Shopping bag icon with item count badge |
| **Account** | User avatar or login button |

```text
+--------------------------------------------------+
| [Logo] Mtaaloop    [    Search products...    ]  |
|                    [Cart🛒] [Login/Account]      |
+--------------------------------------------------+
```

---

## Part 3: Category & Subcategory Filtering

### Category Filter Bar (Horizontal Scrollable)
- "All Products" chip (default selected)
- One chip per category that has products
- Only categories with products appear
- Clicking a category filters the grid

### Subcategory Filter (Appears when category selected)
- "All" tab (shows all subcategories in that category)
- One tab per subcategory in the selected category
- Only subcategories with products appear

**Visual Style**: Pills/chips with primary color when selected, muted when unselected

---

## Part 4: Products Fetching & Sorting

### Database Query

Fetch all available products with their vendor info:

```typescript
const { data: products } = await supabase
  .from('products')
  .select(`
    id, name, description, category, subcategory, price, image_url, 
    is_available, vendor_id,
    vendor_profiles!inner (
      id, business_name, slug, is_approved, is_active
    )
  `)
  .eq('is_available', true)
  .eq('vendor_profiles.is_approved', true)
  .eq('vendor_profiles.is_active', true)
  .order('category', { ascending: true })
  .order('subcategory', { ascending: true })
  .order('name', { ascending: true });
```

### Sorting Order
1. **Category Name** (alphabetically A-Z)
2. **Subcategory Name** (alphabetically A-Z within category)
3. **Product Name** (alphabetically A-Z within subcategory)

### Data Structure After Fetch

```typescript
interface ProductWithVendor {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  vendor_id: string;
  vendor: {
    id: string;
    business_name: string;
    slug: string;
  };
}
```

---

## Part 5: Dynamic Category Discovery

Instead of using hardcoded categories, discover categories from actual products:

```typescript
// Extract unique categories and subcategories from products
const categoriesWithProducts = useMemo(() => {
  const categoryMap = new Map<string, Set<string>>();
  
  products.forEach(product => {
    if (!categoryMap.has(product.category)) {
      categoryMap.set(product.category, new Set());
    }
    if (product.subcategory) {
      categoryMap.get(product.category)!.add(product.subcategory);
    }
  });
  
  // Sort alphabetically
  return Array.from(categoryMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, subcategories]) => ({
      name: category,
      subcategories: Array.from(subcategories).sort()
    }));
}, [products]);
```

---

## Part 6: Product Card Component

Reuse/enhance the existing CategoryProductGrid style with:

| Element | Description |
|---------|-------------|
| **Image** | Product image (aspect-square) with fallback |
| **Name** | Product name (line-clamp-2) |
| **Price** | Bold price in KES |
| **Vendor** | Small vendor name badge |
| **Add Button** | Circular + button to add to cart |

### Product Card Layout

```text
+------------------------+
|      [Product Image]   |
|                        |
+------------------------+
| Product Name           |
| (max 2 lines)          |
+------------------------+
| KES 1,500    [+ Add]   |
| 🏪 Vendor Name         |
+------------------------+
```

---

## Part 7: Filtering Logic

### State Variables

```typescript
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState("");
```

### Filtering Flow

```typescript
const filteredProducts = useMemo(() => {
  let filtered = products;
  
  // 1. Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }
  
  // 2. Category filter
  if (selectedCategory) {
    filtered = filtered.filter(p => p.category === selectedCategory);
  }
  
  // 3. Subcategory filter
  if (selectedSubcategory) {
    filtered = filtered.filter(p => p.subcategory === selectedSubcategory);
  }
  
  return filtered;
}, [products, searchQuery, selectedCategory, selectedSubcategory]);
```

---

## Part 8: Empty States

### No Products Found

```text
+--------------------------------------------------+
|                      🔍                          |
|              No Products Found                   |
|                                                  |
|   No products match your current filters.        |
|   Try adjusting your search or category.         |
|                                                  |
|          [Clear Filters]                         |
+--------------------------------------------------+
```

### Loading State

```text
+--------------------------------------------------+
| [Skeleton] [Skeleton] [Skeleton] [Skeleton]      |
| [Skeleton] [Skeleton] [Skeleton] [Skeleton]      |
+--------------------------------------------------+
```

---

## Part 9: Mobile Responsiveness

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | Stacked (logo above search) | Inline |
| Category chips | Horizontal scroll | Horizontal scroll |
| Product grid | 2 columns | 4 columns |
| Subcategory tabs | Horizontal scroll | Wrap |

---

## Part 10: Implementation Details

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Index.tsx` | **Rewrite** | Complete rewrite to marketplace layout |

### New Index.tsx Structure

```typescript
const Index = () => {
  // State
  const [products, setProducts] = useState<ProductWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Hooks
  const navigate = useNavigate();
  const { addItem, getItemCount } = useCart();
  
  // Fetch products with vendor info
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Derived data
  const categoriesWithProducts = useMemo(() => { ... }, [products]);
  const filteredProducts = useMemo(() => { ... }, [products, ...]);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header>...</header>
      
      <main className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          <Button variant={!selectedCategory ? "default" : "outline"}>
            All Products
          </Button>
          {categoriesWithProducts.map(cat => (
            <Button key={cat.name} variant={...}>
              {cat.name}
            </Button>
          ))}
        </div>
        
        {/* Subcategory Tabs (when category selected) */}
        {selectedCategory && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">...</div>
        )}
        
        {/* Product Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
      
      <Footer />
    </div>
  );
};
```

---

## Summary

| Before | After |
|--------|-------|
| 6 landing page sections | Header + Products + Footer |
| No products shown | All products displayed |
| Category grid (image cards) | Category filter chips |
| Hardcoded categories | Dynamic from products |
| Vendor-focused | Product-focused |
| Informational | Transactional |

### Key Features
1. **Products first** - Users see products immediately
2. **Category filters** - Only categories with products appear
3. **Subcategory filters** - Drill down within categories
4. **Search** - Filter products by name/description
5. **Sorted alphabetically** - Category > Subcategory > Product name
6. **Add to cart** - Direct add-to-cart from product cards
7. **Mobile optimized** - 2-column grid, scrollable filters

### Mtaaloop Style Elements Preserved
- Coral/Teal/Purple color palette via Tailwind theme
- Primary color accents on selected filters
- Card-based product layout
- Rounded corners and shadows
- Mobile-first responsive design
