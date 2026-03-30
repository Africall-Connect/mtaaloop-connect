

# Launch Kit Page — `/launch-kit`

## Overview
A marketing launch kit and social media snippet generator page at `/launch-kit`. It reuses the existing MtaaLoop design system components (MtaaLoopOrbit logo, FloatingIcons, Button, Card, motion animations, gradient styles from HeroSection) and introduces two new reusable components: `PhoneMockup` and a sticky-scroll showcase.

This is a large page with 6 sections. Due to size, the page will be split into the main page file plus sub-components.

---

## Files to Create

### 1. `src/components/launch-kit/PhoneMockup.tsx`
Reusable phone frame component:
- Accepts `children` (renders any React content inside)
- iPhone-style frame: rounded-[2.5rem] border, notch at top, shadow
- Optional `featured` prop for the center phone (taller, purple glow shadow)
- Optional `label` prop rendered below the frame

### 2. `src/components/launch-kit/StickyShowcase.tsx`
The dark-background sticky scroll section (Section 3):
- Uses `position: sticky` + IntersectionObserver on 4 scroll trigger divs
- Left side: step number, headline, description with fade transitions
- Right side: PhoneMockup swapping content based on active step
- Progress pills at bottom (purple active dot)
- Steps: Claim, Discover, Connect, Sell

### 3. `src/components/launch-kit/SocialSnippetCard.tsx`
Individual social card component for the 6-card grid (Section 4):
- Accepts variant prop: `'hero-dark' | 'stat-gradient' | 'feature-cream' | 'connect-dark' | 'vendor-white' | 'urgency-gradient'`
- 1:1 aspect ratio via `aspect-square`
- Hover overlay with "Copy" hint
- Each variant renders its specific layout (logo, text, gradients) as described

### 4. `src/pages/LaunchKit.tsx`
Main page assembling all 6 sections:

**Section 0 — Top Banner**: Reuses the exact gradient banner pattern from HeroSection (indigo-600 via purple-600 to pink-500), text about launching, "Join Waitlist" button.

**Section 1 — Hero Poster**: Mirrors HeroSection layout exactly:
- Green pulse dot + "Now Launching in Nairobi"
- "Your Building." (dark) + "Your Launch." (gradient)
- Subtext about hyperlocal marketplace
- Two CTA buttons (same styling as HeroSection)
- 3 stats boxes (same bordered style)
- FloatingIcons component reused

**Section 2 — Phone Mockup Row**:
- "App Preview" label, "Built for your building." headline
- 4 PhoneMockup components in a horizontal flex row
- Center phone (Browse) gets `featured` prop for larger size + purple glow
- Below: 3 feature cards in a grid
- Note: Phone interiors will render simplified placeholder UI (not actual route components, as those require auth context/data) styled to look like the real screens

**Section 3 — Sticky Scroll Showcase**: Uses StickyShowcase component

**Section 4 — Social Snippets Grid**:
- 3-column grid (1-col on mobile), 6 SocialSnippetCard variants
- Each card is aspect-square

**Section 5 — Instructions Row**: 4 cards in a horizontal row with emoji + title + description

### 5. Route Registration in `src/App.tsx`
- Add lazy import for LaunchKit
- Add `<Route path="/launch-kit" element={<LaunchKit />} />`  (public, no ProtectedRoute)

### 6. Nav Link in `src/components/landing/HeroSection.tsx`
- Add "Launch Kit" item to the Partners dropdown menu

---

## Design System Compliance
- All colors use existing CSS variables (--primary, --foreground, gradients)
- Hard-coded gradient matches HeroSection: `from-indigo-600 via-purple-600 to-pink-500` for banner, `from-blue-600 via-purple-500 to-pink-500` for text gradient
- Buttons use existing Button component with same className patterns
- Stats boxes use same `bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40` pattern
- FloatingIcons reused directly from `@/components/landing/FloatingIcons`
- MtaaLoopOrbit logo reused from `@/components/MtaaLoopLogo`
- All animations use framer-motion with the same wave-from-left/right spring patterns
- Mobile responsive: sections stack vertically, grid goes single column

---

## Estimated Scope
- ~5 new files
- ~1 edit to App.tsx (route)
- ~1 edit to HeroSection.tsx (nav link)

