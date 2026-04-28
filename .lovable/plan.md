# Project Audit — Bugs, Faults & Mobile Polish

## Issues Found

### Critical (cause crashes / broken UX)

1. **Bottom nav clips content on every page (mobile)** — `GlobalLayout` adds only `pb-16 md:pb-0`. The fixed `BottomNavigation` is `h-16` (64px) AND adds `safe-area-bottom`, so total height is ≥64px + iOS home indicator. Almost every page (`Home`, `Cart`, `Account`, `MtaaLoop`, `QuickServices`, `Inbox`, etc.) only has its own internal padding — last items, sticky CTAs, and FABs sit *behind* the nav on iPhones with a notch.
2. **Liquor Hero overflow on small phones** — `LiquorHero` uses `px-6 py-10` and a `min-height: 320px` with no `text-` clamp; the `text-6xl/7xl` headline (in the title block below the snippet I read) overflows on 360px viewports.
3. **MiniMart sticky basket bar collides with BottomNavigation** — `MiniMartView` renders `fixed bottom-0` basket on top of the global BottomNavigation. They overlap and the basket lacks `safe-area-inset-bottom`.
4. **`vite.config.ts` already fixed** — earlier white-screen from missing `simple-peer` in `optimizeDeps.include` (resolved last turn).

### High (mobile-specific layout)

5. **Tables overflow on phones** — `AdminOrders`, `AdminBookings`, `AdminWallets`, `AdminDeliveries`, `CSROrders`, `ApplicationDetailsDialog` render `<table className="w-full text-sm">` with no horizontal scroll wrapper. On 375px screens the table forces page-level horizontal scroll.
6. **Hero text never scales down** — `MtaaLoop`, `MinimartPage`, `MtaaLoopMart` use `text-6xl`/`text-7xl` headlines without an `xs`/`sm` smaller variant. They wrap awkwardly on 320–375px viewports.
7. **Home header truncates location to 120px** — `max-w-[120px]` is too tight; estate names like "Riverside Apartments" get clipped to "Riverside Apar...".
8. **Touch targets** — 401 instances of `Button size="icon"` or `size="sm"` (h-9/w-9 = 36px). Project memory mandates **44px min** touch targets on mobile.
9. **Liquor Age Gate not focus-trapped** — Esc is blocked, but tab focus can still escape the modal; screen-reader users can interact with the page behind it.

### Medium (code quality, no immediate bug)

10. **Hardcoded colors** — `text-white`/`bg-white`/`bg-black` in `MtaaLoop` (28), `LaunchKit` (19), `Footer` (16), `VendorSpotlight` (12), `HeroSection` (8) — violate "use semantic tokens" core rule, break dark-mode parity.
11. **Silent failures** — 16 `console.log` calls in `OrderTracking.tsx`, 8 each in several pages. These ship to production.
12. **Tailwind warning** — `duration-[250ms]` is ambiguous (matches `transition-duration` and `animation-duration`); needs `duration-[250ms]` escaped or replaced with `duration-300`.
13. **`rollup-plugin-polyfill-node`** still in `package.json` though we removed the import — orphan dep.

### Low

14. **TODO** in `Terms.tsx` (placeholder copy) and `RiderDashboard.tsx` (hardcoded mock).
15. **`as any`** spread across ~10 files — biggest offender `lib/api/rider.ts` (17 instances).

---

## Fix Plan (this round — only Critical + High)

I'll group fixes to keep the change set surgical.

### Fix 1 — Global mobile bottom spacing
- `GlobalLayout.tsx`: change `pb-16 md:pb-0` → `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0` so safe-area is always reserved.
- `BottomNavigation.tsx`: keep `safe-area-bottom`; ensure z-index doesn't trap clicks.

### Fix 2 — Responsive headlines
- `LiquorHero.tsx`: clamp display headline with `text-3xl sm:text-4xl md:text-6xl` and reduce `min-height` to `240px` on mobile.
- `MtaaLoop.tsx`, `MinimartPage.tsx`, `MtaaLoopMart.tsx`: prepend smaller mobile sizes to oversized hero `text-*` classes.

### Fix 3 — MiniMart sticky basket
- `MiniMartView.tsx`: change `fixed bottom-0` → `fixed bottom-16 md:bottom-0` and add `pb-[env(safe-area-inset-bottom)]` so it stacks above the global nav.

### Fix 4 — Tables horizontal scroll
- Wrap each `<table>` in admin/CSR pages with `<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">` so they scroll inside their card instead of pushing the page.

### Fix 5 — Home header location width
- `Home.tsx` line 356: `max-w-[120px]` → `max-w-[160px] sm:max-w-[200px]`.

### Fix 6 — Liquor Age Gate focus trap
- Add `tabIndex={-1}` ring trap and autofocus on the "I'm 18+" button.

### Skipped this round (will list separately if you want them done)
- Touch-target audit across 401 buttons (mechanical sweep, large diff).
- Hardcoded color → semantic token migration (large diff, design call needed).
- `console.log` cleanup, `as any` migration, Tailwind warning, orphan dep.

## Technical Details
- All changes are Tailwind class swaps + one wrapper div per table; no logic changes, no schema changes.
- No new dependencies.
- Verified: `safe-area-bottom` utility exists in `src/index.css` line 136. `env(safe-area-inset-bottom)` is supported in Tailwind via arbitrary values.

## Done When
- BottomNavigation never covers content on iPhone 12/13/14 (390×844) or small Android (360×800).
- Liquor, MtaaLoop, Minimart hero headlines fit on 320px without overflow.
- Admin/CSR tables scroll horizontally inside their cards.
- MiniMart basket bar sits above the BottomNavigation, not under it.
- Liquor age gate keeps keyboard focus inside the modal.

Reply "go" to apply these fixes, or tell me which to drop / which from the "Skipped" list to add.
