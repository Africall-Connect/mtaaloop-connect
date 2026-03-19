

## Add "Flowers & Gifts" Category with Floating Flower Animations

### What we're building
1. Add "Flowers & Gifts" as a new inventory category in the vendor system so flower shops can sign up
2. Enhance the existing `FlowersGifts2.tsx` category page with floating flower petal/icon animations
3. Wire everything together so the flow works end-to-end

### Implementation Steps

**1. Add "Flowers & Gifts" to the category system (`src/lib/categories.ts`)**
- Add `"Flowers & Gifts"` to `INVENTORY_CATEGORIES` and `MAIN_CATEGORIES`
- Add subcategories: `["Fresh Flowers", "Bouquets", "Gift Baskets & Hampers", "Indoor Plants", "Cake & Pastries", "Custom Arrangements", "Event Decorations"]`

**2. Add to vendor signup business type (`src/pages/auth/VendorSignup.tsx`)**
- Add `<SelectItem value="flowers-gifts">Flowers & Gifts</SelectItem>` alongside the other inventory categories (after line 189)

**3. Create floating flowers animation component (`src/components/FloatingFlowers.tsx`)**
- A standalone component rendering 15-20 animated flower/petal icons (🌸🌺🌷🌹🌻💐) using CSS keyframes
- Petals drift downward with gentle rotation and horizontal sway
- Randomized sizes (16-36px), positions, durations (8-18s), and delays
- Semi-transparent (`opacity: 0.4-0.7`) so they don't obstruct content
- Uses `pointer-events-none` and `position: fixed` as an overlay

**4. Enhance the FlowersGifts2 page (`src/pages/categories/FlowersGifts2.tsx`)**
- Import and render `<FloatingFlowers />` as a background layer
- Update the gradient background from gray to a soft rose/pink theme
- Fix dark mode: replace hardcoded `text-gray-900` with `text-foreground`

**5. Add animation keyframes (`src/index.css`)**
- Add `@keyframes float-down` with vertical drift, horizontal sway, and rotation
- Add `@keyframes sway` for gentle side-to-side movement

### Technical Details
- The floating flowers use pure CSS animations (no JS runtime cost)
- Each petal gets randomized inline styles for natural variety
- The animation component is reusable and can be added to any flower vendor's storefront later
- No database changes needed; the `vendor_categories` table already supports arbitrary category names

