import { ReactNode, useEffect, CSSProperties } from "react";

/**
 * Per-vendor theming provider.
 *
 * Sets scoped CSS custom properties on a wrapper <div> so each vendor
 * storefront can render with its own brand colours and display font
 * WITHOUT leaking into the customer app, vendor portal, or admin areas.
 *
 * Variables exposed to children:
 *   --vendor-primary
 *   --vendor-accent
 *   --vendor-surface
 *   --vendor-font-display
 *
 * Nothing reads these yet — this is Phase 1.1 plumbing.
 */

type VendorThemeInput = {
  brand_primary?: string | null;
  brand_accent?: string | null;
  brand_surface?: string | null;
  font_display?: string | null;
} | null | undefined;

interface VendorThemeProviderProps {
  vendor: VendorThemeInput;
  children: ReactNode;
}

// Global brand fallbacks (Estate Indigo / Mtaa Amber / cream)
const FALLBACK_PRIMARY = "#1E2A78";
const FALLBACK_ACCENT = "#F5A524";
const FALLBACK_SURFACE = "#F7F3EC";

const FONT_STACKS: Record<string, string> = {
  "inter-tight": "'Inter Tight', system-ui, sans-serif",
  fraunces: "'Fraunces', Georgia, serif",
  archivo: "'Archivo', system-ui, sans-serif",
};

// Google Fonts URLs, loaded only when a vendor needs them.
const FONT_URLS: Record<string, string> = {
  "inter-tight":
    "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap",
  fraunces:
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap",
  archivo:
    "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap",
};

// Module-level guard: ensure each font URL is injected only once per session.
const injectedFonts = new Set<string>();

function injectFontOnce(fontKey: string) {
  if (injectedFonts.has(fontKey)) return;
  const href = FONT_URLS[fontKey];
  if (!href) return;
  if (typeof document === "undefined") return;
  // Defensive: don't double-inject if a previous mount already added it.
  const existing = document.querySelector(`link[data-vendor-font="${fontKey}"]`);
  if (existing) {
    injectedFonts.add(fontKey);
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-vendor-font", fontKey);
  document.head.appendChild(link);
  injectedFonts.add(fontKey);
}

export function VendorThemeProvider({ vendor, children }: VendorThemeProviderProps) {
  const fontKey = vendor?.font_display ?? "default";
  const primary = vendor?.brand_primary ?? FALLBACK_PRIMARY;
  const accent = vendor?.brand_accent ?? FALLBACK_ACCENT;
  const surface = vendor?.brand_surface ?? FALLBACK_SURFACE;
  const fontStack = FONT_STACKS[fontKey] ?? "inherit";

  useEffect(() => {
    if (fontKey && fontKey !== "default" && FONT_URLS[fontKey]) {
      injectFontOnce(fontKey);
    }
  }, [fontKey]);

  const style: CSSProperties = {
    // Cast through `as` so React accepts CSS custom properties.
    ["--vendor-primary" as string]: primary,
    ["--vendor-accent" as string]: accent,
    ["--vendor-surface" as string]: surface,
    ["--vendor-font-display" as string]: fontStack,
  };

  return (
    <div data-vendor-theme="" style={style}>
      {children}
    </div>
  );
}

export default VendorThemeProvider;
