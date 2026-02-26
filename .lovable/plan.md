

# Landing Page UI Overhaul: Sideways Wave Animations & Fresh Copy

## Scope
Revamp all landing page sections and the Index marketplace page with horizontal wave animations, dreamy sway effects, and fresh extraordinary copywriting. Every element enters from the sides with staggered wave timing instead of top-down.

## Changes

### 1. Create new wave animation keyframes in `tailwind.config.ts`
- Add `slide-in-left`, `slide-in-right`, `sway`, `wave-settle` keyframes
- All use `translateX` with elastic/spring easing
- Add `wave-delay-*` utility classes for staggered wave timing (0-11 children)

### 2. Revamp `src/components/landing/HeroSection.tsx`
- Change all `itemVariants` from `y: 20` to `x: -100` (slide from left)
- Add wave stagger with increasing delays per child
- Use spring physics (`type: "spring", stiffness: 80, damping: 15`)
- Fresh copy: "Your Apartment Building" → "Where Neighbors Become Your Marketplace"
- Subtitle rewrite with dreamy, community-first language
- Stats slide in from right with wave delay
- Nav slides from top-right horizontally
- CTA buttons sway gently on idle using `animate` loop

### 3. Revamp `src/components/landing/ProblemSection.tsx`
- Comparison cards slide in from opposite sides (left card from left, right from right)
- Change `itemVariants` from `y: 50` to alternating `x: -120` / `x: 120`
- Add gentle continuous sway animation after settling
- Fresh heading: "Why Mtaaloop Is Radically Different" → "The Old Way is Broken. We Rebuilt It."
- Subtitle rewrite

### 4. Revamp `src/components/landing/HowItWorksSection.tsx`
- 3 steps enter as a horizontal wave: first from left, second from below-center, third from right
- Each card has a spring settle with overshoot (bounce effect)
- Fresh copy for all 3 steps with more vivid, extraordinary language
- Title: "One Building. One Community. One Marketplace." → "Three Steps. Zero Hassle. Infinite Convenience."

### 5. Revamp `src/components/landing/GuaranteeSection.tsx`
- 4 promise cards wave in from the left with staggered `x` offset
- Each settles with a gentle horizontal sway (oscillating translateX)
- Fresh promise descriptions with bolder language

### 6. Revamp `src/components/landing/SocialProof.tsx`
- Cards slide from alternating sides (left/right) with spring physics
- Stats counter items wave in from the right, one by one
- Fresh copy updates

### 7. Revamp `src/components/landing/FinalCTA.tsx`
- Content sweeps in from the left with elastic easing
- Buttons slide from the right with wave delay
- Fresh CTA copy: more urgent, more inviting

### 8. Revamp `src/components/landing/CategoryShowcase.tsx`
- Category cards enter in a horizontal wave pattern (staggered `translateX` from alternating sides)
- Each card has a subtle idle sway animation after settling
- Add framer-motion to this component (currently uses CSS only)

### 9. Update `src/pages/Index.tsx` marketplace sections
- Product grid cards enter with horizontal wave (left to right, row by row)
- Section headers slide in from the left
- Filter chips wave in from the left with micro-delays
- Add framer-motion `AnimatePresence` for section transitions

### 10. Update `src/components/landing/CartoonIllustrations.tsx`
- Change blob movements to primarily horizontal sway patterns
- Slower, dreamier motion (duration 15-25s)
- Add more blobs with pastel tones for depth

### 11. Update `src/components/landing/FloatingIcons.tsx`
- Change from vertical float to horizontal drift (side to side)
- Add gentle sine-wave path using framer-motion keyframes

### 12. Add new CSS keyframes in `src/index.css`
```
@keyframes sway {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(8px); }
  75% { transform: translateX(-8px); }
}

@keyframes wave-settle {
  0% { transform: translateX(-80px); opacity: 0; }
  60% { transform: translateX(6px); opacity: 1; }
  80% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}

@keyframes drift {
  0%, 100% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(30px) translateY(-5px); }
}
```

### Animation Philosophy
- **Entry**: Everything slides horizontally (from left or right) with spring physics
- **Wave pattern**: Each sibling has an increasing delay (0.08s increments) creating a ripple/wave
- **Settle**: Items overshoot slightly then ease back (spring damping)
- **Idle**: Subtle continuous horizontal sway on key elements (3-6px, 4-8s duration)
- **No vertical translateY** anywhere in entrance animations

### Technical Details
- All framer-motion variants use `type: "spring"` with `stiffness: 60-120`, `damping: 12-20`
- Wave stagger: `staggerChildren: 0.08` (faster than current 0.2)
- Viewport trigger: `useInView` with `amount: 0.15` for earlier trigger
- Idle sway uses `animate` with `repeat: Infinity, repeatType: "mirror"`

