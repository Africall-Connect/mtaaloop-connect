import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VendorWithProducts } from "@/types/database";

interface PharmacyStoryProps {
  vendor: VendorWithProducts;
}

export function PharmacyStory({ vendor }: PharmacyStoryProps) {
  const [neighbourCount, setNeighbourCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchNeighbours = async () => {
      const ninetyDaysAgo = new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000
      ).toISOString();
      // distinct customer_id from orders in the last 90 days for this vendor
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (s: string, o?: { count?: string }) => {
            eq: (col: string, val: string) => {
              gte: (col: string, val: string) => Promise<{
                data: { customer_id: string | null }[] | null;
                error: unknown;
              }>;
            };
          };
        };
      })
        .from("orders")
        .select("customer_id")
        .eq("vendor_id", vendor.id)
        .gte("created_at", ninetyDaysAgo);

      if (cancelled) return;
      if (error || !data) {
        setNeighbourCount(0);
        return;
      }
      const unique = new Set(
        data.map((r) => r.customer_id).filter(Boolean) as string[]
      );
      setNeighbourCount(unique.size);
    };
    fetchNeighbours();
    return () => {
      cancelled = true;
    };
  }, [vendor.id]);

  if (!vendor.story) return null;

  const showStat = neighbourCount !== null && neighbourCount >= 10;

  return (
    <div
      className="rounded-xl border px-4 py-3 md:px-5 md:py-4 mb-8 flex items-center gap-4"
      style={{
        background: "var(--vendor-surface)",
        borderColor:
          "color-mix(in srgb, var(--vendor-primary) 15%, transparent)",
      }}
    >
      {vendor.logo_url ? (
        <img
          src={vendor.logo_url}
          alt={vendor.business_name}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full shrink-0"
          style={{
            background:
              "color-mix(in srgb, var(--vendor-primary) 10%, transparent)",
          }}
        />
      )}
      <p
        className="flex-1 text-sm md:text-base leading-snug"
        style={{ color: "var(--vendor-primary)" }}
      >
        {vendor.story}
      </p>
      {showStat && (
        <div
          className="hidden md:flex items-center gap-1.5 text-xs font-medium shrink-0"
          style={{ color: "var(--vendor-primary)", opacity: 0.7 }}
        >
          <Users className="h-3.5 w-3.5" />
          Serving {neighbourCount} neighbours
        </div>
      )}
    </div>
  );
}
