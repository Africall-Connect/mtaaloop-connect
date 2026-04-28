# Fix: Wrong product images & invisible Terms checkbox

## What you're seeing

**1. Wrong images per category**
- **Mpal (Mobile Accessories)** — every product uses `loremflickr.com`, which returns a different random photo on every load. That's why phone holders show up as a cat statue, batteries as a hot dog, etc. Affected vendors in the database:
  - Mpal — 24 products
  - Ilora Flowers — 140 products
  - MtaaLoop Butchery — 34 products
- **Lika Store (Liquor)** — non-liquor items (Beef Jerky, Pretzels, Planters Mixed Nuts, Lays Chips, Bamba, Corn Nuts, Bic Lighter, Camel Cigarettes) all share the same generic snack/candy-bar photo. They should either get correct photos or be removed from the liquor occasion tiles.

**2. Invisible Terms & Conditions checkbox**
On the Review step, the checkbox is rendered with a white background, white-ish border, and sits inside a white card — so it disappears against the page. Only the "I agree…" label is visible, with no obvious tap target.

## Fixes

### A. Replace `loremflickr` with deterministic images (per product)

`loremflickr.com` is the root cause of the random/unrelated photos. Run a one-time SQL update that maps each product to a stable, on-topic image based on its name keywords. Use curated Unsplash URLs (already the project pattern) keyed by keyword:

- **Mpal** — power bank → power-bank photo, charger → charger photo, cable → cable, case → phone case, earbuds → earbuds, speaker → speaker, screen protector → screen protector, SD card → microSD, phone stand/mount → phone holder, battery → phone battery.
- **Ilora Flowers** — roses, lilies, carnations, sunflowers, orchids, tulips, bouquet → matching flower photos.
- **MtaaLoop Butchery** — beef, goat, chicken, mutton, sausage, liver, etc. → matching meat photos.

Implemented as one SQL migration with `UPDATE products SET image_url = … WHERE vendor_id = … AND name ILIKE '%keyword%'` blocks. Fallback: products that match no keyword get the vendor's category default image instead of loremflickr.

### B. Clean up Lika Store non-liquor items

Two options for the snack/cigarette/lighter rows that all share the candy-bar photo:
1. Give each its correct Unsplash photo (jerky, pretzels, peanuts, chips, lighter, cigarettes) — keeps them as legit "mixers/snacks at the liquor store".
2. Hide them from the customer-facing Liquor view by setting `is_active = false`.

**Recommendation:** Option 1 — keep them, but with correct photos and ensure their `occasion_tag` is `friday-crew` so they group sensibly. (User feedback can decide later.)

### C. Add a global image fallback to stop future loremflickr leaks

In `src/lib/placeholderImages.ts` (or wherever images are resolved) add an `onError` handler on product `<img>` tags that swaps the broken/random image for a category-appropriate placeholder. This protects against any new loremflickr URLs sneaking in.

### D. Fix the Terms & Conditions checkbox visibility

In `src/components/ui/checkbox.tsx`:
- Replace `bg-white border-primary` with theme-aware styling: a visible 2px slate/foreground border, a tinted background that contrasts against the white card, and a clear focus ring.
- Bump size from `h-5 w-5` to `h-6 w-6` for an easier tap target on mobile (matches the 44px-touch-target rule).

In `src/components/TermsAgreementCheckbox.tsx` (`variant="card"`):
- Strengthen the card border (`border-2 border-primary/60`) and add a subtle background tint so the checkbox stands out.
- Ensure the entire card is clickable (wrap in a `label` or add `onClick` that toggles the checkbox), so users can tap anywhere on the row.

## Technical details

- **Files to edit**
  - `src/components/ui/checkbox.tsx` — visible border + larger size
  - `src/components/TermsAgreementCheckbox.tsx` — stronger card variant + clickable row
  - `src/lib/placeholderImages.ts` — `onError` fallback helper (and apply it in `LiquorProductCard.tsx`, `HomeProductCard.tsx`, `VendorProductGrid.tsx`)
- **New SQL migration** — bulk `UPDATE products` to replace all `loremflickr.com` URLs with curated Unsplash URLs grouped by vendor + keyword match.
- **Verification** — after migration, run `SELECT count(*) FROM products WHERE image_url LIKE '%loremflickr%'` — expect `0`.

## Out of scope

- Re-shooting actual product photography (we use stock photos that match the product type, not the exact SKU).
- Removing snacks/cigarettes from Lika Store entirely — happy to do this if you prefer, just say the word.

Reply **"go"** to apply these fixes.