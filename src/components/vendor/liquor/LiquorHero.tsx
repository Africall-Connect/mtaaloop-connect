import { useEffect, useState } from "react";
import { Clock, MapPin, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VendorWithProducts } from "@/types/database";

interface LiquorHeroProps {
  vendor: VendorWithProducts;
}

const CREAM = "#F5E6D3";

export function LiquorHero({ vendor }: LiquorHeroProps) {
  const [neighbourCount, setNeighbourCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ninety = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("orders")
        .select("customer_id")
        .eq("vendor_id", vendor.id)
        .gte("created_at", ninety);
      if (cancelled) return;
      const unique = new Set(
        (data ?? []).map((r: { customer_id: string | null }) => r.customer_id).filter(Boolean) as string[]
      );
      setNeighbourCount(unique.size);
    })();
    return () => { cancelled = true; };
  }, [vendor.id]);

  const scrollToOccasions = () => {
    const el = document.getElementById("occasions");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const whatsappHref = (() => {
    const phone = (vendor.business_phone || "").replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      "Hi, I'd like to put together a custom liquor order — can you help?"
    );
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  })();

  const trustPills = [
    { icon: ShieldCheck, label: "ID checked on delivery" },
    { icon: Clock, label: vendor.delivery_time || "Within the hour" },
    {
      icon: MapPin,
      label:
        neighbourCount && neighbourCount >= 10
          ? `${neighbourCount} on the block trust us`
          : "Local to your block",
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-2xl mb-8"
      style={{
        background: "var(--vendor-surface)",
        minHeight: "240px",
      }}
    >
      {/* Radial gradient mood overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--vendor-primary) 25%, transparent), transparent 60%)",
        }}
      />

      <div className="relative px-5 sm:px-6 md:px-10 py-8 sm:py-10 md:py-14">
        {/* Logo */}
        {vendor.logo_url && (
          <div
            className="inline-block rounded-full p-1 mb-6"
            style={{
              border: `1px solid color-mix(in srgb, var(--vendor-accent) 60%, transparent)`,
            }}
          >
            <img
              src={vendor.logo_url}
              alt={vendor.business_name}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover"
              style={{ filter: "sepia(0.3) saturate(1.2)" }}
            />
          </div>
        )}

        {/* Vendor name */}
        <h1
          className="text-3xl sm:text-4xl md:text-6xl mb-3 leading-[0.95] break-words"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 500,
            color: CREAM,
            letterSpacing: "-0.02em",
          }}
        >
          {vendor.business_name}
        </h1>

        {/* Tagline */}
        {vendor.tagline && (
          <p
            className="text-base md:text-xl italic mb-7 max-w-2xl"
            style={{
              fontFamily: "var(--vendor-font-display)",
              color: "var(--vendor-accent)",
              opacity: 0.8,
            }}
          >
            {vendor.tagline}
          </p>
        )}

        {/* Trust pills */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-8">
          {trustPills.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs md:text-sm"
              style={{
                color: CREAM,
                border: `1px solid color-mix(in srgb, var(--vendor-accent) 50%, transparent)`,
                background: "transparent",
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: "var(--vendor-accent)" }} />
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={scrollToOccasions}
            className="rounded-lg px-6 py-3 text-sm md:text-base font-medium border transition-colors duration-300"
            style={{
              background: "transparent",
              color: "var(--vendor-accent)",
              borderColor: "var(--vendor-accent)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--vendor-accent)";
              e.currentTarget.style.color = "var(--vendor-surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--vendor-accent)";
            }}
          >
            Browse the bar
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-6 py-3 text-sm md:text-base font-medium transition-opacity duration-300"
            style={{
              background: "transparent",
              color: CREAM,
              opacity: 0.7,
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            Build a custom order
          </a>
        </div>
      </div>
    </section>
  );
}

export default LiquorHero;
