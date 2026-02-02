
# UI Redesign Plan: Landing Page, Cart, Checkout & My Orders

## Overview
This plan updates 4 key pages to match MtaaLoop's design system while preserving all existing logic.

---

## Current Theme Characteristics (from Home.tsx & Account.tsx)

| Element | Current Pattern |
|---------|-----------------|
| Background | `bg-gradient-to-br from-background via-primary/5 to-background` |
| Headers | Sticky with `backdrop-blur-sm`, subtle border and shadow |
| Cards | Hover effects with `hover:shadow-xl`, `hover:-translate-y-1` |
| Icons | Wrapped in `p-2 bg-primary/10 rounded-full` |
| Section Titles | Icon + Title + Subtitle pattern |
| Buttons | Primary with `gap-2` for icon+text |
| Status Badges | Use semantic colors (`success`, `destructive`, etc.) |

---

## Page 1: Landing Page (Index.tsx)

### Current Issues
- Plain `bg-background` with no gradient
- Header lacks the warm gradient feel of Home.tsx
- Cards are functional but lack hover polish
- Filter chips don't match the primary color scheme

### Changes

**Header Enhancement:**
- Add gradient background: `bg-gradient-to-br from-background via-primary/5 to-background`
- Add subtle hero section below header with welcome text and gradient overlay
- Style the logo section with same pattern as Home.tsx

**Product Cards:**
- Add `hover:shadow-lg hover:-translate-y-1 transition-all duration-300`
- Add gradient overlay on image: `bg-gradient-to-br from-primary/5 to-transparent`
- Use `border-primary/10 hover:border-primary/30` for borders

**Section Headers:**
- Replace emoji-based headers with icon wrapper pattern:
  ```
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-primary/10 rounded-full">
      <ShoppingCart className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h2>Shop Now</h2>
      <p className="text-muted-foreground">...</p>
    </div>
  </div>
  ```

**Filter Chips:**
- Active: `bg-primary text-primary-foreground`
- Inactive: `bg-background border-primary/20 hover:border-primary/40`
- Replace emojis with Lucide icons

---

## Page 2: Cart (Cart.tsx)

### Current Issues
- Plain `bg-background` without gradient
- Cards lack the elevated design from other pages
- Summary section needs visual hierarchy improvement
- Vendor header could use more polish

### Changes

**Page Container:**
```typescript
<div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
```

**Vendor Group Cards:**
- Add gradient header: `bg-gradient-to-br from-primary/10 to-primary/5`
- Store icon in circular wrapper: `<div className="p-2 bg-primary/10 rounded-full">`
- Add hover states for interactive elements

**Item Cards:**
- Add subtle left border accent: `border-l-4 border-primary/20`
- Image containers with rounded corners and subtle shadow
- Price in `text-primary font-bold`

**Summary Card:**
- Gradient top border: `border-t-4 border-primary`
- Total section with background highlight: `bg-primary/5 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4`
- Checkout button with `shadow-glow` on hover

**Saved Items Section:**
- Heart icon in orange wrapper: `bg-orange-500/10 text-orange-600`
- Cards with dashed border: `border-dashed border-2`

---

## Page 3: Checkout (Checkout.tsx)

### Current Issues
- Plain background without gradient
- Steps indicator is functional but basic
- Cards lack the branded feel
- Payment method cards need visual hierarchy

### Changes

**Page Container:**
```typescript
<div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-24 sm:pb-0">
```

**Step Indicators:**
- Active step: `bg-primary text-primary-foreground shadow-md`
- Completed step: `bg-primary text-primary-foreground`
- Pending step: `bg-muted text-muted-foreground`
- Connecting lines: Use gradient for completed sections
- Add pulse animation to current step

**Form Cards:**
- Header with icon wrapper pattern (not emoji):
  ```
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-primary/10 rounded-full">
      <MapPin className="h-5 w-5 text-primary" />
    </div>
    <h2 className="text-xl font-bold">Delivery Details</h2>
  </div>
  ```
- Replace emoji headers with icon-based headers
- Add `border-primary/10` to cards

**Payment Method Cards:**
- Selected state: `border-primary bg-primary/5 shadow-sm`
- Add icon for each payment type
- M-PESA: Green accent `border-l-4 border-emerald-500`
- Wallet: Primary accent `border-l-4 border-primary`

**Review Step:**
- Order summary with gradient header
- Items list with compact styling
- CTA button with `animate-pulse-glow` on hover

---

## Page 4: My Orders (MyOrders.tsx)

### Current Issues
- Plain background without gradient
- Order cards are basic
- Status badges use emoji (should use icons)
- Tab styling doesn't match theme

### Changes

**Page Container:**
```typescript
<div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
```

**Header:**
- Icon in wrapper: `<div className="p-2 bg-primary/10 rounded-full"><Package className="h-5 w-5 text-primary" /></div>`
- Title with count badge

**Tabs:**
- Active tab: `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`
- Tab list with `bg-muted/50 p-1 rounded-lg`

**Order Cards:**
- Left border accent based on status:
  - Pending: `border-l-4 border-warning`
  - Active: `border-l-4 border-primary`
  - Delivered: `border-l-4 border-success`
  - Cancelled: `border-l-4 border-destructive`
- Add hover effect: `hover:shadow-lg hover:border-primary/20 transition-all`
- Status badges without emoji, use icons:
  - Pending: `<Clock className="h-3 w-3" />`
  - Preparing: `<ChefHat className="h-3 w-3" />`
  - Delivered: `<CheckCircle2 className="h-3 w-3" />`

**Premium Badge:**
- Gold styling: `bg-gradient-to-r from-amber-500 to-yellow-400 text-white`

**Empty State:**
- Package icon in large wrapper with animation
- Gradient CTA button

---

## Design Token Summary

| Token | Usage |
|-------|-------|
| `bg-gradient-to-br from-background via-primary/5 to-background` | Page backgrounds |
| `p-2 bg-primary/10 rounded-full` | Icon wrappers |
| `hover:shadow-xl hover:-translate-y-1 transition-all duration-300` | Card hover |
| `border-primary/10 hover:border-primary/30` | Card borders |
| `shadow-glow` | CTA button emphasis |
| `text-success`, `text-warning`, `text-destructive` | Status colors |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Gradient background, icon-based section headers, polished cards |
| `src/pages/Cart.tsx` | Gradient background, vendor card styling, summary polish |
| `src/pages/Checkout.tsx` | Gradient background, icon headers, payment card styling |
| `src/pages/MyOrders.tsx` | Gradient background, status-based card borders, icon badges |

---

## Technical Notes

- No logic changes - only className and icon updates
- Replace all emoji usages in headers with Lucide icons
- Use existing Tailwind design tokens from `index.css`
- Maintain mobile responsiveness with existing breakpoints
- All changes are purely visual/cosmetic
