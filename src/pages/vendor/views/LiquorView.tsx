import { useMemo } from "react";
import { Product, VendorWithProducts } from "@/types/database";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { LiquorAgeGate } from "@/components/vendor/liquor/LiquorAgeGate";
import { LiquorHero } from "@/components/vendor/liquor/LiquorHero";
import { LiquorStory } from "@/components/vendor/liquor/LiquorStory";
import { LiquorProductCard } from "@/components/vendor/liquor/LiquorProductCard";

interface LiquorViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

const OCCASION_ORDER: Array<{ key: string; label: string }> = [
  { key: "friday-crew", label: "Friday Crew" },
  { key: "solo-wind-down", label: "Solo Wind-Down" },
  { key: "cocktail-night", label: "Cocktail Night" },
  { key: "celebration", label: "Celebration" },
  { key: "beer-run", label: "Beer Run" },
  { key: "last-minute-gift", label: "Last-Minute Gift" },
  { key: "other", label: "Other" },
];

const CREAM = "#F5E6D3";

export function LiquorView({ vendor, products }: LiquorViewProps) {
  const { addItem } = useCart();

  const grouped = useMemo(() => {
    const g: Record<string, Product[]> = {};
    for (const p of products) {
      const key = ((p as Product & { occasion_tag?: string | null }).occasion_tag) || "other";
      if (!g[key]) g[key] = [];
      g[key].push(p);
    }
    return g;
  }, [products]);

  const handleReserve = (product: Product) => {
    addItem({
      id: product.id,
      vendorId: vendor.id,
      vendorName: vendor.business_name,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url || undefined,
    });
    toast.success("Reserved", {
      description: `1x ${product.name} added to your reservation`,
    });
  };

  return (
    <div
      className="-mx-4 md:-mx-6 -my-6 md:-my-8 px-4 md:px-6 py-6 md:py-8"
      style={{
        background: "var(--vendor-surface)",
        color: CREAM,
        minHeight: "100vh",
      }}
    >
      <LiquorAgeGate vendorId={vendor.id} />

      <LiquorHero vendor={vendor} />
      <LiquorStory vendor={vendor} />

      <div id="occasions" className="space-y-12 md:space-y-16">
        {OCCASION_ORDER.map(({ key, label }) => {
          const items = grouped[key];
          if (!items || items.length === 0) return null;
          return (
            <section key={key}>
              <header className="mb-5">
                <h3
                  className="text-2xl md:text-3xl italic"
                  style={{
                    fontFamily: "var(--vendor-font-display)",
                    fontWeight: 500,
                    color: CREAM,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {label}
                </h3>
                <div
                  className="mt-3 h-px w-full"
                  style={{
                    background:
                      "color-mix(in srgb, var(--vendor-accent) 30%, transparent)",
                  }}
                />
              </header>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map((product) => (
                  <LiquorProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleReserve}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {products.length === 0 && (
          <div
            className="text-center py-20 rounded-xl border"
            style={{
              borderColor:
                "color-mix(in srgb, var(--vendor-accent) 20%, transparent)",
              color: CREAM,
              opacity: 0.7,
            }}
          >
            Nothing here right now — check back Friday.
          </div>
        )}
      </div>

      {/* Footer disclaimer */}
      <p
        className="mt-16 mb-4 text-center text-xs"
        style={{ color: CREAM, opacity: 0.5 }}
      >
        Drink responsibly. Do not drink and drive. Sale of alcohol prohibited to persons under 18.
      </p>
    </div>
  );
}

export default LiquorView;
