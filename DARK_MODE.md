# 🌙 Dark Mode Implementation

## Overview
Dark mode is now fully functional across the MtaaLoop application. Users can toggle between light and dark themes from the Settings page.

## Features

### ✅ Theme Options
- **Light Mode** - Default bright theme
- **Dark Mode** - Dark background with light text
- **System** - Automatically matches OS preference

### ✅ Persistence
- Theme preference saved to localStorage
- Persists across sessions
- Key: `mtaaloop-ui-theme`

### ✅ Visual Feedback
- Sun icon (☀️) for light mode
- Moon icon (🌙) for dark mode
- Status text shows current theme
- Smooth transition animations

## Implementation

### 1. Theme Provider
**File:** `src/components/theme-provider.tsx`

```typescript
import { useTheme } from "@/components/theme-provider"

// In your component:
const { theme, setTheme } = useTheme()
setTheme("dark")  // or "light" or "system"
```

### 2. App Integration
Theme provider wraps the entire application in `App.tsx`:

```tsx
<ThemeProvider defaultTheme="system" storageKey="mtaaloop-ui-theme">
  {/* All app components */}
</ThemeProvider>
```

### 3. Settings Page
**Location:** Account → Settings → Preferences

Users can toggle dark mode with a switch that:
- Shows current theme status
- Displays appropriate icon (sun/moon)
- Instantly applies the change
- Saves preference automatically

## Technical Details

### CSS Classes
The theme is applied by adding/removing the `dark` class to the HTML root element:

```html
<!-- Light mode -->
<html lang="en" class="light">

<!-- Dark mode -->
<html lang="en" class="dark">
```

### Tailwind Configuration
Tailwind's dark mode is configured to use class strategy in `tailwind.config.ts`:

```typescript
export default {
  darkMode: ["class"],
  // ...
}
```

### Color Scheme
All components use Tailwind's dark mode utilities:

```tsx
// Background automatically changes based on theme
<div className="bg-background text-foreground">

// Different colors for light/dark
<div className="bg-white dark:bg-gray-900">
```

## Usage Examples

### Toggle Theme Programmatically
```typescript
import { useTheme } from "@/components/theme-provider"

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme("dark")}>
      Enable Dark Mode
    </button>
  )
}
```

### Check Current Theme
```typescript
const { theme } = useTheme()
const isDark = theme === "dark"
```

### React to System Changes
The theme provider automatically listens to system preference changes when theme is set to "system".

## Testing

### Manual Testing
1. Open the app at http://localhost:5173
2. Navigate to Account → Settings
3. Scroll to "Preferences" section
4. Toggle the "Dark Mode" switch
5. Theme should change instantly
6. Refresh the page - theme should persist

### Different Scenarios
- ✅ Fresh install - uses system preference
- ✅ After toggle - saves user choice
- ✅ Page refresh - loads saved theme
- ✅ Different tabs - shares same theme
- ✅ System change (when "system" selected) - updates automatically

## Browser Support

### localStorage
All modern browsers support localStorage. If unavailable, falls back to default theme.

### prefers-color-scheme
System theme detection works on:
- Chrome/Edge 76+
- Firefox 67+
- Safari 12.1+
- Opera 62+

## Customization

### Change Default Theme
Edit in `App.tsx`:
```tsx
<ThemeProvider defaultTheme="light" storageKey="mtaaloop-ui-theme">
```

### Change Storage Key
```tsx
<ThemeProvider storageKey="my-custom-theme-key">
```

### Add Theme Options
Edit `theme-provider.tsx`:
```typescript
type Theme = "dark" | "light" | "system" | "auto"
```

## CSS Variables

The theme uses CSS variables defined in `index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

## Known Limitations

### Fast Refresh Warning
The theme provider exports both a component and a hook, which triggers a warning:
```
Fast refresh only works when a file only exports components.
```

This is **not a runtime error** and doesn't affect functionality. The warning can be safely ignored or the hook can be moved to a separate file if desired.

## Future Enhancements

### Potential Improvements
- [ ] Theme picker with multiple color schemes
- [ ] Auto dark mode based on time of day
- [ ] Per-page theme overrides
- [ ] Theme transition animations
- [ ] A/B testing different default themes
- [ ] Theme analytics (which is preferred)

## Troubleshooting

### Theme Not Persisting
**Issue:** Theme resets after refresh

**Solutions:**
1. Check localStorage is enabled in browser
2. Clear localStorage and try again: `localStorage.clear()`
3. Check browser console for errors

### Theme Not Applying
**Issue:** Dark mode toggle doesn't work

**Solutions:**
1. Verify ThemeProvider is wrapping the app
2. Check Tailwind config has `darkMode: ["class"]`
3. Ensure components use dark: utilities
4. Check browser DevTools - `<html>` should have `dark` class

### System Theme Not Detected
**Issue:** System preference not working

**Solutions:**
1. Browser may not support `prefers-color-scheme`
2. OS theme detection may be disabled
3. Try manually selecting dark/light instead of system

## Migration Guide

### Adding Dark Mode to New Components

**Before:**
```tsx
<div className="bg-white text-black">
```

**After:**
```tsx
<div className="bg-background text-foreground">
// or
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

### Using Theme in Existing Pages
Import the hook:
```tsx
import { useTheme } from "@/components/theme-provider"

const MyPage = () => {
  const { theme } = useTheme()
  return <div>Current theme: {theme}</div>
}
```

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Fully Functional
