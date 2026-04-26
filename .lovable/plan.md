## Phase 1.1 — Per-Vendor Theming Foundation

Goal: ship the theming **plumbing** so every vendor storefront can later render with its own brand. Customer-visible UI must look pixel-identical after this phase.

### Confirmed current state
- `vendor_profiles` already has `tagline` (text, nullable) and `delivery_time` (text, nullable) — those columns will **not** be re-added; only seed values get written.
- 5 new columns are needed: `brand_primary`, `brand_accent`, `brand_surface`, `font_display`, `hero_style`.
- All 4 live vendors exist with exact name matches:
  - Tsavo Pharmacy (`pharmacy`)
  - Lika Store (`liquor-store`)
  - Lisa Two Toiletries (`groceries-essentials`) — note trailing space in DB, will match with `TRIM(business_name) ILIKE`
  - LISA SERVICES (`living-essentials`)
- Generated Supabase types live in `src/integrations/supabase/types.ts` and regenerate automatically after migration — no manual edit. The hand-rolled `VendorProfile` interface in `src/types/database.ts` will get the 5 optional fields added.

---

### Step 1 — Migration (schema only)

Add 5 nullable text columns to `public.vendor_profiles`:
```
brand_primary  text
brand_accent   text
brand_surface  text
font_display   text
hero_style     text
```

Then a single `UPDATE` to backfill defaults from `business_type` for **all rows** (so future vendors inherit too) using a `CASE` mapping:

| business_type | primary | accent | surface | font | hero |
|---|---|---|---|---|---|
| pharmacy | #0F766E | #10B981 | #FFFFFF | inter-tight | clinical |
| liquor-store | #7B1E22 | #B08D57 | #1A0F0F | fraunces | moody |
| groceries-essentials | #F4C2C2 | #E8A4A4 | #FFF8F5 | default | soft |
| living-essentials | #F5A524 | #000000 | #FFFEF5 | archivo | bold |
| restaurant | #C65D3A | #F5A524 | #FFF8F0 | default | warm |
| (else) | #1E2A78 | #F5A524 | #F7F3EC | default | default |

No CHECK constraints — values are advisory. No RLS changes (existing policies cover all columns).

### Step 2 — Seed the 4 live vendors (data, via insert/update tool)

Run 4 targeted `UPDATE` statements (matched by `TRIM(LOWER(business_name))`) to write intentional values **including** `tagline` and `delivery_time`:

- **Tsavo Pharmacy** → primary `#0F766E`, accent `#10B981`, surface `#FFFFFF`, font `inter-tight`, hero `clinical`, tagline "Your trusted neighbourhood pharmacy", delivery_time "Within the hour"
- **Lika Store** → primary `#7B1E22`, accent `#B08D57`, surface `#1A0F0F`, font `fraunces`, hero `moody`, tagline "For the Friday crew and the solo wind-down", delivery_time "Within the hour"
- **Lisa Two Toiletries** → primary `#F4C2C2`, accent `#E8A4A4`, surface `#FFF8F5`, font `default`, hero `soft`, tagline "Skin, hair, home — the soft essentials", delivery_time "Today by 6pm"
- **LISA SERVICES** → primary `#F5A524`, accent `#000000`, surface `#FFFEF5`, font `archivo`, hero `bold`, tagline "The mtaa mini-mart, restocked daily", delivery_time "45 min"

Each `UPDATE` returns the affected row count; after running, a verification `SELECT` confirms all 4 are non-null on every theming column. (All 4 are confirmed present in DB right now — no skip/warn expected.)

### Step 3 — `VendorThemeProvider` component

New file: `src/components/vendor/VendorThemeProvider.tsx`

- Props: `{ vendor: { brand_primary?: string|null; brand_accent?: string|null; brand_surface?: string|null; font_display?: string|null; ... }, children: ReactNode }`
- Renders a single `<div data-vendor-theme>` wrapper with inline `style` setting:
  - `--vendor-primary` (fallback `#1E2A78`)
  - `--vendor-accent` (fallback `#F5A524`)
  - `--vendor-surface` (fallback `#F7F3EC`)
  - `--vendor-font-display` mapped from `font_display`:
    - `inter-tight` → `'Inter Tight', system-ui, sans-serif`
    - `fraunces` → `'Fraunces', Georgia, serif`
    - `archivo` → `'Archivo', system-ui, sans-serif`
    - `default` / null → `inherit`
- **Scoped, not global** — variables live on the wrapper div, never `document.documentElement`, so vendor portal / customer app are unaffected.
- Inside a `useEffect`, lazy-injects a `<link rel="stylesheet">` to Google Fonts **only for the font this vendor needs** (skips if `default`). Uses a module-level `Set` to guard against duplicate injection across re-renders / vendor switches. Includes `display=swap` in the URL.
- No visual styling applied to children — purely sets variables.

### Step 4 — Wire into VendorHome

In `src/pages/vendor/VendorHome.tsx`, wrap **only** the three existing return blocks (loading skeleton, "vendor not found", and the main render) in `<VendorThemeProvider vendor={vendor ?? null}>…</VendorThemeProvider>`. No other edits to the file. Nothing reads the variables yet — that's expected and intentional.

### Step 5 — Types

Add 5 optional fields to the hand-rolled `VendorProfile` interface in `src/types/database.ts`:
```ts
brand_primary?: string | null;
brand_accent?: string | null;
brand_surface?: string | null;
font_display?: string | null;
hero_style?: string | null;
```
The auto-generated `src/integrations/supabase/types.ts` refreshes itself after the migration — not edited manually.

### Acceptance verification (post-implementation)
1. `SELECT brand_primary, brand_accent, brand_surface, font_display, hero_style, tagline, delivery_time FROM vendor_profiles WHERE id IN (4 ids)` → all non-null.
2. Visit `/vendor/tsavo-pharmacy` (and the other 3) → DOM inspector shows `<div data-vendor-theme style="--vendor-primary:#0F766E; …">`.
3. Page renders pixel-identical to current state (no consumers of the variables yet).
4. No TS errors, no console errors, no font flash on `/`, `/home`, `/checkout`, `/admin/*`, `/vendor-portal/*`.

### Out of scope (deferred to later phases)
- Reading the CSS variables anywhere (hero, cards, buttons).
- Category-archetype storefronts (clinical pharmacy, moody liquor, etc.).
- Founder story block, hero redesign, archetype `*View` refactors.
- Routing changes, vendor portal UI for editing brand fields.
