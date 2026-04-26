import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VendorWithProducts } from "@/types/database";

interface LiquorStoryProps {
  vendor: VendorWithProducts;
}

const CREAM = "#F5E6D3";

export function LiquorStory({ vendor }: LiquorStoryProps) {
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

  if (!vendor.story) return null;

  const showStat = neighbourCount !== null && neighbourCount >= 10;

  return (
    <div
      className="my-10 py-6 md:py-7 px-6 md:px-8 flex items-center gap-5"
      style={{
        background:
          "color-mix(in srgb, var(--vendor-surface) 96%, white 4%)",
        borderTop: `1px solid color-mix(in srgb, var(--vendor-accent) 20%, transparent)`,
        borderBottom: `1px solid color-mix(in srgb, var(--vendor-accent) 20%, transparent)`,
      }}
    >
      {vendor.logo_url && (
        <img
          src={vendor.logo_url}
          alt={vendor.business_name}
          className="w-12 h-12 rounded-full object-cover shrink-0"
          style={{ filter: "sepia(0.3) saturate(1.2)" }}
        />
      )}
      <p
        className="flex-1 text-sm md:text-base leading-relaxed"
        style={{
          color: CREAM,
          opacity: 0.9,
          fontFamily: "var(--vendor-font-display)",
          fontStyle: "italic",
        }}
      >
        {vendor.story}
      </p>
      {showStat && (
        <div
          className="hidden md:flex items-center gap-2 text-xs font-medium shrink-0"
          style={{ color: "var(--vendor-accent)", opacity: 0.85 }}
        >
          <Users className="h-3.5 w-3.5" />
          Serving {neighbourCount} neighbours
        </div>
      )}
    </div>
  );
}

export default LiquorStory;
