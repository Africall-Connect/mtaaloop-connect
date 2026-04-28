I hear you. The checkbox still fails because the checked state is not visually different enough in the actual checkout layout, and the product image work was too narrow. Here is the corrected plan.

## 1. Make the Terms agreement state impossible to miss

I will rebuild the checkout terms control so the checked state is unmistakable:

- Replace the current subtle green state with a high-contrast selected state:
  - solid filled green panel
  - large white check icon in a filled circle
  - clear label: `AGREED - Terms accepted`
  - optional secondary text: `You can now place your order`
- Keep the unchecked state clearly different:
  - warning/amber border
  - empty checkbox square
  - label: `Tap to accept Terms & Conditions`
- Add a checked/unchecked text indicator beside the box so the state is visible even if color contrast is poor.
- Ensure the whole card remains tappable on mobile with a minimum 44px touch target.
- Update the sticky `Place Order` button label/state so it reinforces the checkbox state:
  - unchecked: `Accept Terms to Place Order`
  - checked: `Place Order — KSh ...`

## 2. Stop relying on weak image fallbacks

I will replace the current limited fallback logic with a centralized, product-name-aware image resolver.

It will choose images using this order:

```text
product name keyword match
  -> subcategory match
  -> main category match
  -> safe generic product fallback
```

This means `Chicken Wings`, `Red Wine`, `Colgate Toothpaste`, `Power Bank`, `Roses`, `Panadol`, etc. will get images that match the actual item, not just the broad category.

## 3. Apply image matching across all product grids/cards

I will update the UI components that display product images so every product card uses the same smart image logic:

- `CategoryProductGrid`
- `HomeProductCard`
- any vendor/liquor product card still using raw/broken/random image behavior

The UI will no longer show huge base64 uploads, broken images, random placeholders, or unrelated fallback images when a better product/category match exists.

## 4. Audit all current database categories, not only three

I checked the live product categories and found data under all of these groups:

- Butchery
- Flowers & Gifts
- Groceries & Essentials
- groceries-essentials
- Liquor Store
- liquor-store
- Living Essentials
- living-essentials
- Mobile Accessories
- Pharmacy
- pharmacy

I will cover all of them in the resolver, including slug and title-case variants.

## 5. Normalize category route matching so products are not hidden by naming mismatch

Some products use display names like `Liquor Store`, while others use slugs like `liquor-store`. The category page currently filters with exact category equality, so products can be missing or split incorrectly.

I will update category product fetching/filtering so each category accepts both forms where needed:

- `Liquor Store` and `liquor-store`
- `Living Essentials` and `living-essentials`
- `Groceries & Food`, `Groceries & Essentials`, and `groceries-essentials` where applicable
- `Pharmacy` and `pharmacy`

## 6. Database image cleanup for existing bad image data

After the UI resolver is fixed, I will prepare a data update for existing products whose `image_url` is clearly bad or inappropriate:

- replace `data:image/...` base64 product images with proper URLs
- replace known mismatched generic product images where the product name clearly indicates a better image
- keep vendor-uploaded images only when they are usable and not obviously random/broken

This will be handled as data correction, not a schema migration.

## Technical details

Files expected to change:

- `src/components/TermsAgreementCheckbox.tsx`
- `src/pages/Checkout.tsx`
- `src/lib/placeholderImages.ts` or a new shared image resolver module
- `src/components/CategoryProductGrid.tsx`
- `src/components/home/HomeProductCard.tsx`
- relevant vendor product card components if they bypass the shared resolver
- category page query/filter logic in `src/pages/categories/[category].tsx`

Database work:

- No schema changes.
- Only product data corrections for existing `products.image_url` values that are base64, placeholder/random, broken, or obviously mismatched.

## Acceptance checks

Before I call it done, I will verify:

- Terms checkbox unchecked and checked states look obviously different.
- The checked state is readable without relying on a tiny checkmark only.
- The sticky order button changes meaningfully after acceptance.
- Each current product category has matching product imagery logic.
- Category pages show both slug-format and display-name-format products where applicable.
- Product cards fall back to product/subcategory/category images instead of unrelated placeholders.