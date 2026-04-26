## Phase 1.3 — Lika Store Liquor Archetype

Goal: Transform Lika Store into a moody, brass-on-oxblood, occasion-driven liquor experience. Tsavo, Lisa Two, and LISA SERVICES remain pixel-identical.

### Confirmed pre-state
- Lika: `business_type='liquor-store'`, `operational_category='inventory'`, 127 products, brand tokens already seeded (#7B1E22 / #B08D57 / #1A0F0F, fraunces, hero 'moody'), `story` is NULL, `open_hours` is NULL.
- `vendor_profiles.story` column exists (added in Phase 1.2). No need to re-add.
- `products` has `symptom_category`, `requires_prescription`, `dosage_form`. No `occasion_tag` and no `abv` columns yet.
- Currently Lika routes through `InventoryView` because `operational_category='inventory'`.

---

### STEP 1 — Database migration

Add nullable columns to `products`:
- `occasion_tag text` with CHECK constraint: `'friday-crew' | 'solo-wind-down' | 'last-minute-gift' | 'celebration' | 'cocktail-night' | 'beer-run' | 'other'`
- `abv numeric(4,1)` (nullable, e.g. 5.0, 12.5, 40.0, 43.0)

### STEP 2 — Backfill Lika data (insert/update)

- `vendor_profiles.story` for Lika → "Run by James from inside Tsavo — the bar that knows your usual, even on a Tuesday."
- `products.occasion_tag` for all 127 Lika products via SQL `CASE` on subcategory + name keywords:
  - Local Beer / Imported Beer / Stout / Cider → `beer-run`
  - Whiskey & Bourbon premium (price > 3000 or single malt / Macallan / McVoy / McLaren) → `solo-wind-down`
  - Whiskey & Bourbon mid → `friday-crew`
  - Vodka / Gin / Tequila / Rum / Liqueur → `friday-crew`
  - Champagne / Sparkling / Prosecco / gift packs → `celebration`
  - Sparkling Wine → `celebration`; other Wine / Red Wine / White Wine → `solo-wind-down`
  - Mixers / Syrups / Bitters / Cocktail kits → `cocktail-night`
  - Miniatures → `last-minute-gift`
  - Tobacco / Lighters / accessories → `other`
  - Default → `friday-crew`
- `products.abv` backfill: beer ~5.0, stout ~5.5, cider ~4.5, wine ~12.0, sparkling ~11.5, spirits ~40.0, premium spirits ~43.0, liqueur ~17.0, miniatures match parent category. Tobacco/accessories left null.

### STEP 3 — Routing in `VendorHome.tsx`

In the "Render the correct view" block (around line 340):
- Add: `business_type === 'liquor-store'` → render `<LiquorView />`.
- Suppress generic hero banner for liquor archetype too (alongside pharmacy).
- Suppress the sticky filter bar count for liquor (LiquorView uses occasion sections, not a flat product count). The Sort dropdown stays — restyled by VendorThemeProvider variables.
- Lisa Two and LISA SERVICES (`living-essentials` / `groceries-essentials` / others) keep falling through to `InventoryView` exactly as today — pixel-identical.

### STEP 4 — New components in `src/components/vendor/liquor/`

**`LiquorAgeGate.tsx`** — Modal blocking storefront on first mount per vendor session. Uses `sessionStorage` key `liquor_age_verified_${vendorId}`. Not dismissible by Esc, outside click, or URL param. "Yes, I'm 18+" sets the flag; "No, take me back" navigates to `/home`. Background uses `--vendor-surface`, headline in Fraunces 500, primary button filled `--vendor-primary`, secondary outline `--vendor-accent`. Footer: "We do not sell to minors. ID may be required on delivery." at 60% opacity.

**`LiquorHero.tsx`** — Dark hero with radial gradient from `--vendor-primary` 25% top-left fading to transparent. Vendor logo (brass tint), name in Fraunces 500 cream-white (#F5E6D3), tagline in italic brass-80%. Three trust pills with brass-50% borders: "ID checked on delivery", delivery_time, "{neighbours_served} on the block trust us" (uses same 90-day distinct customer count as PharmacyStory; hides if <10). Primary CTA "Browse the bar" smooth-scrolls to `#occasions`. Secondary "Build a custom order" → WhatsApp deep link with prefilled message. No product photography.

**`LiquorStory.tsx`** — Story strip styled for dark theme. Background = `--vendor-surface` lifted 4% via `color-mix`. Top + bottom hairlines in brass 20%. Avatar + cream-white-90% story text. Right-aligned stat "Serving {n} neighbours" hidden if <10. Reads from `vendor.story`.

**`LiquorProductCard.tsx`** — Card bg = `--vendor-surface` lifted 6%. Border 1px `--vendor-accent` 15% → 50% on hover, 300ms transition, no lift/scale/bounce. Full-bleed image with bottom dark vignette. Top-right: "18+" pill (primary bg, brass border, cream text). Bottom-left: occasion tag pill (brass 25% tint, brass text). Product name in Fraunces 500 cream-white. Price in tabular brass. ABV line beneath name at 60% opacity if present. "Reserve" button outline brass → fills brass on hover. `onAdd` calls `addItem` from CartContext (same shape as Pharmacy/Inventory).

**`LiquorView.tsx`** — Mirrors PharmacyView structure. Renders `LiquorAgeGate` first, `LiquorHero`, `LiquorStory`, then occasion sections in this fixed order, skipping empty:
- Friday Crew → Solo Wind-Down → Cocktail Night → Celebration → Beer Run → Last-Minute Gift → Other

Each section header in Fraunces 500 italic cream-white with brass-30% hairline. Anchor `id="occasions"` before first section so hero CTA can scroll to it. Footer disclaimer at bottom (50% opacity): "Drink responsibly. Do not drink and drive. Sale of alcohol prohibited to persons under 18." Empty section copy: "Nothing here right now — check back Friday." Wrapper has dark background = `--vendor-surface` and forces text inheritance to cream-white locally (only inside LiquorView, not leaking).

### STEP 5 — VendorNavbar restyle for liquor

In `src/components/vendor/VendorNavbar.tsx`, extend the existing `isPharmacy` branch to also detect `isLiquor = vendor.business_type === 'liquor-store'`. When liquor:
- nav background = `--vendor-surface`
- text + icons = cream-white (#F5E6D3), brass on hover
- cart icon and logo border = `--vendor-accent` (brass)
Pharmacy styling unchanged. All other vendors render exactly as today.

### STEP 6 — Voice pass (liquor-only, scoped to LiquorView)

Inside LiquorView and LiquorProductCard only:
- "Add to cart" → "Reserve"
- Toast on add → `"Reserved"` / `"1x ${name} added to your reservation"`
- Empty section → "Nothing here right now — check back Friday."
- Empty cart message: not in scope here (FloatingCartButton lives outside), but the in-card button text is fully replaced.
- No emoji anywhere in LiquorView components.

> Note: cart drawer/checkout copy ("Your reservation") would require touching cart components which the prompt forbids modifying outside this scope. The card-level "Reserve" CTA satisfies the storefront acceptance — system-wide cart copy stays cart-default. Will document this scope decision in the completion note.

### STEP 7 — Type updates

In `src/types/database.ts`, extend the `Product` interface with optional `occasion_tag?: string | null` and `abv?: number | null`. The generated `src/integrations/supabase/types.ts` is auto-managed by Supabase — leave untouched.

---

### Files created
- `supabase/migrations/<ts>_liquor_archetype.sql` (schema only — adds `occasion_tag`, `abv`)
- Data backfill via the insert tool (separate UPDATE statements for `vendor_profiles.story`, `products.occasion_tag`, `products.abv`)
- `src/components/vendor/liquor/LiquorAgeGate.tsx`
- `src/components/vendor/liquor/LiquorHero.tsx`
- `src/components/vendor/liquor/LiquorStory.tsx`
- `src/components/vendor/liquor/LiquorProductCard.tsx`
- `src/pages/vendor/views/LiquorView.tsx`

### Files edited
- `src/pages/vendor/VendorHome.tsx` — add liquor routing branch + suppress hero banner for liquor
- `src/components/vendor/VendorNavbar.tsx` — add liquor-archetype styling branch
- `src/types/database.ts` — extend Product with `occasion_tag`, `abv`

### Files NOT touched (proof of containment)
- `src/pages/vendor/views/InventoryView.tsx`
- `src/pages/vendor/views/PharmacyView.tsx`
- `src/pages/vendor/views/ServiceView.tsx`, `BookingView.tsx`
- All cart, checkout, tracking, vendor portal, admin, customer Home files

### Acceptance verification plan
- Lika storefront: age gate → moody hero → story → 6 occasion sections → disclaimer footer.
- Tsavo storefront: still PharmacyView, identical to Phase 1.2.
- Lisa Two & LISA SERVICES: still InventoryView, no visual change.
- Customer home grid `/home`: VendorThemeProvider stays scoped to `VendorHome` only — no leak.
- Reporting after run: counts per `occasion_tag`, count with `abv` set, products that fell into 'other'.
