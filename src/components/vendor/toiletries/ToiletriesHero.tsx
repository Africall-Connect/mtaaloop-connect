import { Leaf, Clock, Heart } from "lucide-react";
import type { VendorWithProducts } from "@/types/database";

const PLUM = "#3D2B2B";

interface Props {
  vendor: VendorWithProducts;
  onBrowseClick: () => void;
}

export function ToiletriesHero({ vendor, onBrowseClick }: Props) {
  const phone = (vendor.business_phone || "").replace(/\D/g, "");
  const waLink = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        "Hi Lisa, I'd like advice on what to use for my skin/hair routine."
      )}`
    : "#";

  return (
    <section
      className="relative overflow-hidden rounded-2xl mb-8"
      style={{
        background: "var(--vendor-surface)",
        color: PLUM,
        padding: "32px 24px 36px",
        border: "1px solid color-mix(in srgb, var(--vendor-primary) 25%, transparent)",
      }}
    >
      {/* Hand-drawn line illustration: woven basket with bottles */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="absolute top-2 right-2 md:top-4 md:right-6 pointer-events-none"
        style={{
          width: 140,
          height: 140,
          color: "color-mix(in srgb, var(--vendor-accent) 50%, transparent)",
          opacity: 0.45,
        }}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* basket */}
          <path d="M40 130 q60 22 122 -2 l-12 50 q-50 16 -100 0 z" />
          <path d="M44 142 q56 18 116 -2" />
          <path d="M48 156 q52 16 108 -2" />
          <path d="M54 170 q48 14 100 -2" />
          {/* basket weave verticals */}
          <path d="M70 132 v44" />
          <path d="M100 134 v45" />
          <path d="M132 132 v44" />
          {/* bottle 1 */}
          <path d="M70 70 q0 -10 8 -10 h12 q8 0 8 10 v55 h-28 z" />
          <path d="M80 60 v-10 h8 v10" />
          {/* bottle 2 (pump) */}
          <path d="M110 80 q0 -8 7 -8 h10 q7 0 7 8 v45 h-24 z" />
          <path d="M120 70 v-12" />
          <path d="M115 58 h12 q3 0 3 3 v3 h-15 z" />
          {/* sprig */}
          <path d="M150 100 q-6 -12 -2 -22" />
          <path d="M148 90 q-8 -2 -10 -8" />
          <path d="M148 84 q4 -4 4 -10" />
        </g>
      </svg>

      <div className="relative max-w-3xl">
        <h1
          className="leading-tight"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 400,
            color: PLUM,
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            letterSpacing: "-0.01em",
          }}
        >
          {vendor.business_name}
        </h1>
        {vendor.tagline && (
          <p
            className="mt-2 italic"
            style={{
              fontFamily: "var(--vendor-font-display)",
              color: "var(--vendor-primary)",
              fontSize: "clamp(1rem, 2.2vw, 1.25rem)",
            }}
          >
            {vendor.tagline}
          </p>
        )}

        {/* Trust pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { icon: Leaf, label: "Skin-safe brands" },
            { icon: Clock, label: vendor.delivery_time || "Today by 6pm" },
            {
              icon: Heart,
              label: `${Math.max(vendor.total_orders || 24, 24)} neighbours restocking weekly`,
            },
          ].map(({ icon: Icon, label }, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                border:
                  "1px solid color-mix(in srgb, var(--vendor-primary) 40%, transparent)",
                color: PLUM,
                background: "rgba(255,255,255,0.5)",
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: "var(--vendor-primary)" }} />
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onBrowseClick}
            className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: "var(--vendor-primary)",
              color: PLUM,
            }}
          >
            Find what fits your skin
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--vendor-primary)",
              color: PLUM,
              background: "transparent",
            }}
          >
            WhatsApp Lisa for advice
          </a>
        </div>
      </div>
    </section>
  );
}

export default ToiletriesHero;
