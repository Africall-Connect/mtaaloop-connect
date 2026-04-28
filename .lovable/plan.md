## Problem

On the landing page hero (`/`), the top navigation row contains: logo + "Connect" + "Partners ▾" + "Log In" + "Get Started". At the user's 648px viewport (and anything below ~720px), these 5 elements overflow the row. Because the landing page is a horizontal snap-scroller with `overflow-hidden`, the overflowing buttons (Log In, Get Started) get clipped off-screen with no way to reach them.

The hero's main CTA buttons (`Claim Your Building` / `Welcome Back`) already stack correctly via `flex-col sm:flex-row`, so they are fine — the issue is strictly the top nav bar.

A secondary issue: the announcement bar (`top-16`) and the nav (`top-0`) can visually collide on small screens because the announcement is tall (icon + two lines of text + Try It button).

## Fix (smart, minimal)

Edit `src/components/landing/HeroSection.tsx` only.

### 1. Mobile-friendly nav

Replace the flat 4-button row with a responsive layout:

- **Mobile (`<sm`)**: show logo on the left, and on the right a single compact "Log In" ghost button + a hamburger `Menu` icon button. The hamburger opens a `DropdownMenu` containing: Connect, Join as Vendor, Register Estate, Become a Rider, Launch Kit, and Get Started (as the highlighted item).
- **Desktop (`≥sm`)**: keep the current full row exactly as-is.

This guarantees the Log In button is always visible and tappable on mobile, while keeping the desktop design unchanged. Reuses the existing `DropdownMenu` primitives already imported — no new deps.

### 2. Announcement bar spacing

- On mobile, tighten the announcement bar: shrink padding (`py-2 px-3`), drop the decorative pulsing circle to `hidden sm:flex`, and let the title wrap. Keep "Try It" button visible.
- Push the nav down slightly so it sits below a taller wrapped announcement: change nav from `top-0` to `top-[72px] sm:top-0` and adjust hero vertical centering padding so content doesn't shift on desktop.

Actually simpler: keep nav at `top-0` and move the announcement to `top-[64px]` on mobile only — but the cleanest result is to swap their stacking: render **nav at `top-0`** (always visible, primary nav), and the announcement banner just below it at `top-14 sm:top-16`. That matches user expectations (nav first, promo second) and removes the overlap.

### 3. Touch targets

Ensure mobile nav buttons are at least 44px tall (use `size="sm"` with `h-11` override, or `size="default"`). The hamburger uses `size="icon"` which is already 40px — bump to `h-11 w-11` on mobile.

## Files changed

- `src/components/landing/HeroSection.tsx` — restructure top nav (mobile dropdown), reorder announcement under nav, tighten announcement on mobile.

No other files need changes. Desktop appearance is preserved.

## Verification

After the change, at 648px viewport the user should see:
- Logo + "Log In" + ☰ menu in the top bar, all visible
- ☰ menu opens to reveal Get Started, Connect, Partners options
- Announcement bar sits below the nav, no overlap
- Hero CTAs unchanged and reachable

Reply "go" to apply.