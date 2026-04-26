import { Box, Clock, RefreshCw } from "lucide-react";
import type { VendorWithProducts } from "@/types/database";

interface Props {
  vendor: VendorWithProducts;
  itemCount: number;
  listMode: boolean;
  onToggleList: () => void;
}

const BLACK = "#000000";

export function MiniMartHero({ vendor, itemCount, listMode, onToggleList }: Props) {
  const phone = vendor.business_phone || "";
  const telLink = phone ? `tel:${phone.replace(/\s+/g, "")}` : "#";

  return (
    <section
      className="relative mb-6"
      style={{
        background: "var(--vendor-surface)",
        color: BLACK,
        border: "1px solid #000",
      }}
    >
      <div style={{ height: 6, background: "var(--vendor-accent)", width: "100%" }} />
      <div className="px-5 md:px-7 py-6 md:py-8">
        <h1
          className="leading-none uppercase"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 800,
            color: "var(--vendor-accent)",
            letterSpacing: "-0.02em",
            fontSize: "clamp(2rem, 6vw, 3.75rem)",
          }}
        >
          {vendor.business_name}
        </h1>
        {vendor.tagline && (
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 400,
              color: BLACK,
              opacity: 0.7,
              fontSize: "clamp(0.95rem, 1.8vw, 1.125rem)",
            }}
          >
            {vendor.tagline}
          </p>
        )}

        {/* Trust pills (square) */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { icon: Box, label: `${itemCount} items in stock` },
            { icon: Clock, label: vendor.delivery_time || "45 min" },
            { icon: RefreshCw, label: "Restocked today" },
          ].map(({ icon: Icon, label }, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              style={{
                border: "1px solid #000",
                color: BLACK,
                background: "transparent",
                fontFamily: "var(--vendor-font-display)",
                fontWeight: 600,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onToggleList}
            className="px-5 py-2.5 text-sm uppercase transition-colors"
            style={{
              background: listMode ? BLACK : "var(--vendor-primary)",
              color: listMode ? "var(--vendor-primary)" : BLACK,
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 800,
              letterSpacing: "0.02em",
            }}
          >
            {listMode ? "Visual mode" : "Start your list"}
          </button>
          <a
            href={telLink}
            className="px-5 py-2.5 text-sm uppercase transition-colors"
            style={{
              border: "1px solid #000",
              color: BLACK,
              background: "transparent",
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 800,
              letterSpacing: "0.02em",
            }}
          >
            Call the mart
          </a>
        </div>
      </div>
    </section>
  );
}

export default MiniMartHero;
