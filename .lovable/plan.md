
# Landing Page Enhancement: Compact Cards & Sectioned Layout

## Overview

Reorganize the product grid into 3 distinct sections based on operational type, with smaller/compact product cards for a denser marketplace feel.

---

## Section Design

### 3 Sections (Creative Names)

| Section | Operational Types | Categories Included | Emoji |
|---------|-------------------|---------------------|-------|
| **Shop Now** | Inventory | Food & Drinks, Living Essentials, Groceries & Food, Restaurant, Liquor Store | 🛒 |
| **Book a Service** | Service + Booking | Utilities & Services, Home Services, Beauty & Spa, Accommodation | 📅 |
| **Health & Pharmacy** | Pharmacy | Pharmacy (medicines, consultations) | 💊 |

Each section will only render if there are products available in that category.

---

## Visual Layout

```
+--------------------------------------------------+
| HEADER (logo, search, cart, account)             |
+--------------------------------------------------+
| CATEGORY CHIPS (All | Shop | Services | Health)  |
+--------------------------------------------------+

🛒 SHOP NOW
+--------+ +--------+ +--------+ +--------+ +--------+
|  img   | |  img   | |  img   | |  img   | |  img   |
| Name   | | Name   | | Name   | | Name   | | Name   |
| KES 50 | | KES 80 | | KES 120| | KES 200| | KES 150|
+--------+ +--------+ +--------+ +--------+ +--------+

📅 BOOK A SERVICE  
+--------+ +--------+ +--------+
|  img   | |  img   | |  img   |
| Name   | | Name   | | Name   |
| KES 500| | KES 800| | KES 1000|
+--------+ +--------+ +--------+

💊 HEALTH & PHARMACY
+--------+ +--------+
|  img   | |  img   |
| Name   | | Name   |
| KES 150| | KES 300|
+--------+ +--------+
```

---

## Changes to Make

### 1. Smaller Product Cards

| Current | New |
|---------|-----|
| `aspect-square` image | `aspect-[4/3]` shorter image |
| `p-3` padding | `p-2` tighter padding |
| `text-sm` name | `text-xs` smaller name |
| `text-base` price | `text-sm` compact price |
| `h-8 w-8` add button | `h-6 w-6` smaller button |
| Grid: 2/3/4 cols | Grid: 2/3/4/5 cols (more items per row) |

### 2. Section Grouping Logic

Use `getOperationalType` from `src/lib/categories.ts` to classify products:

```typescript
import { getOperationalType, INVENTORY_CATEGORIES, SERVICE_CATEGORIES, BOOKING_CATEGORIES, PHARMACY_CATEGORIES } from "@/lib/categories";

// Group filtered products by section
const productsBySection = useMemo(() => {
  const sections = {
    shop: [] as ProductWithVendor[],      // inventory
    services: [] as ProductWithVendor[],  // service + booking
    health: [] as ProductWithVendor[],    // pharmacy
  };
  
  filteredProducts.forEach(product => {
    const opType = getOperationalType(product.category);
    if (opType === 'inventory') {
      sections.shop.push(product);
    } else if (opType === 'service' || opType === 'booking') {
      sections.services.push(product);
    } else if (opType === 'pharmacy') {
      sections.health.push(product);
    } else {
      // Fallback: add to shop
      sections.shop.push(product);
    }
  });
  
  return sections;
}, [filteredProducts]);
```

### 3. Section Component

Create a reusable section wrapper:

```typescript
const ProductSection = ({ 
  title, 
  emoji, 
  products, 
  onAddToCart, 
  onProductClick 
}: {
  title: string;
  emoji: string;
  products: ProductWithVendor[];
  onAddToCart: (e: React.MouseEvent, product: ProductWithVendor) => void;
  onProductClick: (product: ProductWithVendor) => void;
}) => {
  if (products.length === 0) return null;
  
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map(product => (
          <CompactProductCard key={product.id} ... />
        ))}
      </div>
    </section>
  );
};
```

### 4. Compact Product Card

Smaller, denser card design:

```typescript
<Card className="overflow-hidden cursor-pointer hover:border-primary transition-all group">
  {/* Shorter image */}
  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
    {product.image_url ? (
      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
    )}
  </div>
  
  {/* Compact info */}
  <div className="p-2">
    <h3 className="font-medium text-xs line-clamp-1">{product.name}</h3>
    <div className="flex items-center justify-between mt-1">
      <span className="text-sm font-bold text-primary">
        KES {product.price.toLocaleString()}
      </span>
      <Button size="icon" className="h-6 w-6 rounded-full">
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  </div>
</Card>
```

### 5. Updated Filter Chips

Change from category-specific chips to section-based:

```typescript
const [selectedSection, setSelectedSection] = useState<string | null>(null);

// Section filter options
const sectionFilters = [
  { id: null, label: "All", emoji: "🏠" },
  { id: "shop", label: "Shop", emoji: "🛒" },
  { id: "services", label: "Services", emoji: "📅" },
  { id: "health", label: "Health", emoji: "💊" },
];

// Filter sections based on selection
const visibleSections = useMemo(() => {
  if (!selectedSection) return productsBySection;
  return {
    shop: selectedSection === 'shop' ? productsBySection.shop : [],
    services: selectedSection === 'services' ? productsBySection.services : [],
    health: selectedSection === 'health' ? productsBySection.health : [],
  };
}, [selectedSection, productsBySection]);
```

---

## Technical Details

### File to Modify
- `src/pages/Index.tsx` - Update layout, add sectioning, compact cards

### New Imports
```typescript
import { getOperationalType } from "@/lib/categories";
```

### State Changes
- Add `selectedSection` state for section filtering
- Remove `selectedSubcategory` (simplified UX)
- Keep `searchQuery` for search functionality

### Grid Responsive Breakpoints
| Breakpoint | Columns |
|------------|---------|
| Default (mobile) | 2 |
| sm (640px) | 3 |
| md (768px) | 4 |
| lg (1024px) | 5 |

---

## Summary

| Before | After |
|--------|-------|
| Single flat product grid | 3 themed sections |
| Large product cards | Compact dense cards |
| Category-specific filters | Section-based filters (All, Shop, Services, Health) |
| 4 columns max | 5 columns max |
| Verbose card info | Minimal: name + price + add button |

### Result
- Cleaner, more organized marketplace layout
- Faster visual scanning with smaller cards
- Logical grouping by what users want to do (buy, book, health)
- Only sections with products are displayed
