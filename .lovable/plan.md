
# Complete Plan: Fix 404, Remove Emojis, Add Real Images + AI Image Generation

## Overview

This plan addresses three major tasks:
1. **Fix 404 Route**: Add `/services/trash-collection` route
2. **Remove All Emojis**: Replace 386+ emoji usages with Lucide icons
3. **Real Placeholder Images**: Replace emoji fallbacks with Unsplash images
4. **AI Image Generation**: Create edge function + component using Lovable AI (Nano banana)

---

## Part 1: Fix Missing Route (Quick)

**Issue**: `/services/trash-collection` returns 404 - the route exists at `/trash-collection`

**File: `src/App.tsx`**

Add route after line 282:
```typescript
<Route path="/services/trash-collection" element={
  <ProtectedRoute>
    <TrashCollection />
  </ProtectedRoute>
} />
```

---

## Part 2: Create Icon Utility System

Replace emoji strings with Lucide React icons using a centralized utility.

**New File: `src/lib/serviceIcons.tsx`**

```typescript
import { 
  Trash2, Package, Sparkles, Home, Shirt, ChefHat, 
  Footprints, Truck, Coins, Store, ShoppingCart, ShoppingBag
} from 'lucide-react';

// Maps service slugs to Lucide icons
export const SERVICE_ICONS = {
  'trash-collection': Trash2,
  'package-collection': Package,
  'osha-viombo': Sparkles,
  'quick-cleaning': Home,
  'laundry-sorting': Shirt,
  'quick-meal-prep': ChefHat,
  'errands': Footprints,
  'delivery': Truck,
  'cashback': Coins,
};

// Category icons for QuickServices tabs
export const CATEGORY_ICONS = {
  'delivery': Package,
  'cleaning': Sparkles,
  'cooking': ChefHat,
  'errands': Footprints,
};

export function getServiceIcon(slug: string) {
  return SERVICE_ICONS[slug] || Package;
}
```

---

## Part 3: Create Placeholder Images Utility

**New File: `src/lib/placeholderImages.ts`**

```typescript
export const PLACEHOLDER_IMAGES = {
  vendor: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400&h=300&fit=crop',
  store: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
  service: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
  delivery: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop',
  cooking: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  laundry: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=300&fit=crop',
  trash: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop',
  errands: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop',
  cart: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=300&fit=crop',
};

export function getPlaceholderImage(type: keyof typeof PLACEHOLDER_IMAGES): string {
  return PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.vendor;
}
```

---

## Part 4: Update Components to Use Icons Instead of Emojis

### Files to Update:

| File | Changes |
|------|---------|
| `src/types/subscription.ts` | Change `icon: '🗑️'` to `icon: 'trash-collection'` (use slug) |
| `src/components/services/ServiceCard.tsx` | Render Lucide icon from `getServiceIcon(service.slug)` |
| `src/pages/QuickServices.tsx` | Replace emoji tabs with Lucide icons |
| `src/pages/MtaaLoopPlus.tsx` | Replace service preview emojis |
| `src/pages/TrashTracking.tsx` | Replace status emojis |
| `src/pages/Cart.tsx` | Replace cart emoji with ShoppingCart icon |
| `src/pages/categories/Shopping.tsx` | Replace page header emoji |
| `src/pages/services/LaundrySorting.tsx` | Replace header emoji |
| `src/components/VendorSpotlight.tsx` | Replace fallback emoji with Store icon |
| `src/pages/Home.tsx` | Replace avatar fallback emoji |
| `src/pages/rider/RiderDashboard.tsx` | Replace button emoji |
| `src/pages/rider/RiderActiveOrders.tsx` | Replace status emojis |

### Example Changes:

**ServiceCard.tsx** - Replace line 43:
```typescript
// Before
<div className="text-3xl sm:text-4xl shrink-0">{service.icon}</div>

// After  
const IconComponent = getServiceIcon(service.slug);
<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
</div>
```

**QuickServices.tsx** - Replace tab emojis (lines 109-120):
```typescript
<TabsTrigger value="delivery" className="shrink-0 gap-1">
  <Package className="w-4 h-4" /> Delivery
</TabsTrigger>
<TabsTrigger value="cleaning" className="shrink-0 gap-1">
  <Sparkles className="w-4 h-4" /> Cleaning
</TabsTrigger>
// etc.
```

**VendorSpotlight.tsx** - Replace fallback emoji (lines 87-90):
```typescript
// Before
<span className="text-6xl sm:text-9xl opacity-20">🏪</span>

// After
<Store className="w-24 h-24 sm:w-40 sm:h-40 text-primary/20" />
```

**Cart.tsx** - Replace empty cart emoji (line 53):
```typescript
// Before
<div className="text-6xl mb-4">🛒</div>

// After
<ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
```

---

## Part 5: AI Image Generation Feature

### 5.1 Create Edge Function

**New File: `supabase/functions/generate-image/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = "google/gemini-2.5-flash-image" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      // Handle rate limits
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const text = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ imageUrl, text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5.2 Update Supabase Config

**File: `supabase/config.toml`**

Add:
```toml
[functions.generate-image]
enabled = true
verify_jwt = false
```

### 5.3 Create React Component

**New File: `src/components/ImageGenerator.tsx`**

A component that:
- Takes a text prompt input
- Calls the edge function
- Displays the generated image
- Shows loading/error states
- Option to download or use the image

### 5.4 Create Demo Page (Optional)

**New File: `src/pages/ImageGenerator.tsx`**

A page to test and showcase the AI image generation feature.

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | Edit | Add `/services/trash-collection` route |
| `src/lib/serviceIcons.tsx` | Create | Icon mapping utility |
| `src/lib/placeholderImages.ts` | Create | Placeholder image URLs |
| `src/types/subscription.ts` | Edit | Change emoji icons to slug references |
| `src/components/services/ServiceCard.tsx` | Edit | Render Lucide icons |
| `src/pages/QuickServices.tsx` | Edit | Replace tab emojis |
| `src/pages/MtaaLoopPlus.tsx` | Edit | Replace preview emojis |
| `src/pages/Cart.tsx` | Edit | Replace cart emojis |
| `src/pages/TrashTracking.tsx` | Edit | Replace status emojis |
| `src/pages/categories/Shopping.tsx` | Edit | Replace header emoji |
| `src/pages/services/LaundrySorting.tsx` | Edit | Replace header emoji |
| `src/components/VendorSpotlight.tsx` | Edit | Replace fallback emoji with icon |
| `src/pages/Home.tsx` | Edit | Replace avatar fallback |
| `src/pages/rider/RiderDashboard.tsx` | Edit | Replace button emoji |
| `src/pages/rider/RiderActiveOrders.tsx` | Edit | Replace status emojis |
| `supabase/functions/generate-image/index.ts` | Create | AI image generation edge function |
| `supabase/config.toml` | Edit | Add generate-image function config |
| `src/components/ImageGenerator.tsx` | Create | React component for image generation |

---

## Implementation Order

1. **Fix Route** - Add missing `/services/trash-collection` route
2. **Create Utilities** - `serviceIcons.tsx` and `placeholderImages.ts`
3. **Update Core Components** - ServiceCard, QuickServices, VendorSpotlight
4. **Update All Pages** - Cart, MtaaLoopPlus, TrashTracking, category pages, rider pages
5. **Create AI Edge Function** - `generate-image/index.ts`
6. **Update Config** - Add function to `config.toml`
7. **Create AI Component** - `ImageGenerator.tsx`

---

## Technical Notes

- **LOVABLE_API_KEY** is already configured as a secret (verified)
- Using `google/gemini-2.5-flash-image` (Nano banana) as default model
- Option to use `google/gemini-3-pro-image-preview` for higher quality
- All emoji replacements use existing Lucide icons already imported in the project
- Placeholder images use Unsplash with proper sizing parameters
