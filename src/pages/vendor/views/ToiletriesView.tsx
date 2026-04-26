import { useMemo, useRef, useState } from "react";
import type { Product, VendorWithProducts } from "@/types/database";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { ToiletriesHero } from "@/components/vendor/toiletries/ToiletriesHero";
import { ToiletriesStory } from "@/components/vendor/toiletries/ToiletriesStory";
import {
  SkinTypeChips,
  type SkinTypeFilter,
} from "@/components/vendor/toiletries/SkinTypeChips";
import { ToiletriesProductCard } from "@/components/vendor/toiletries/ToiletriesProductCard";

interface ToiletriesViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

const SECTION_ORDER: Array<{ key: string; label: string }> = [
  { key: "skin", label: "Skin" },
  { key: "hair", label: "Hair" },
  { key: "body", label: "Body" },
  { key: "home-laundry", label: "Home & Laundry" },
  { key: "tools", label: "Tools" },
  { key: "other", label: "Other" },
];

const PLUM = "#3D2B2B";

type ToiletriesProduct = Product & {
  skin_type?: string | null;
  toiletries_category?: string | null;
  pack_size?: string | null;
  refill_cadence_days?: number | null;
};

export function ToiletriesView({ vendor, products }: ToiletriesViewProps) {
  const { addItem } = useCart();
  const [filter, setFilter] = useState<SkinTypeFilter>("all");
  const filterRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo<ToiletriesProduct[]>(() => {
    const list = products as ToiletriesProduct[];
    if (filter === "all") return list;
    return list.filter((p) => p.skin_type === filter);
  }, [products, filter]);

  const grouped = useMemo(() => {
    const g: Record<string, ToiletriesProduct[]> = {};
    for (const p of filtered) {
      const key = p.toiletries_category || "other";
      if (!g[key]) g[key] = [];
      g[key].push(p);
    }
    return g;
  }, [filtered]);

  const handleAdd = (product: Product) => {
    addItem({
      id: product.id,
      vendorId: vendor.id,
      vendorName: vendor.business_name,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url || undefined,
    });
    toast.success("Added to bag", {
      description: `1x ${product.name}`,
    });
  };

  const scrollToFilter = () => {
    filterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="-mx-4 md:-mx-6 -my-6 md:-my-8 px-4 md:px-6 py-6 md:py-8"
      style={{
        background: "var(--vendor-surface)",
        color: PLUM,
        minHeight: "100vh",
      }}
    >
      <ToiletriesHero vendor={vendor} onBrowseClick={scrollToFilter} />
      <ToiletriesStory vendor={vendor} />

      <div ref={filterRef} className="sticky top-[140px] md:top-[180px] z-20 py-3 -mx-4 md:-mx-6 px-4 md:px-6"
        style={{ background: "color-mix(in srgb, var(--vendor-surface) 92%, transparent)", backdropFilter: "blur(6px)" }}>
        <SkinTypeChips value={filter} onChange={setFilter} />
      </div>

      <div className="space-y-10 md:space-y-14 mt-4">
        {SECTION_ORDER.map(({ key, label }) => {
          const items = grouped[key];
          if (!items || items.length === 0) return null;
          return (
            <section key={key}>
              <h3
                className="italic mb-4"
                style={{
                  fontFamily: "var(--vendor-font-display)",
                  fontWeight: 400,
                  color: PLUM,
                  fontSize: "clamp(1.4rem, 2.6vw, 1.875rem)",
                }}
              >
                {label}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {items.map((product) => (
                  <ToiletriesProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: PLUM, opacity: 0.65 }}>
            Nothing in this category yet.
          </div>
        )}
      </div>

      <p className="mt-14 mb-4 text-center text-xs" style={{ color: PLUM, opacity: 0.6 }}>
        All products patch-tested. If anything irritates, message Lisa and we'll swap it.
      </p>
    </div>
  );
}

export default ToiletriesView;
