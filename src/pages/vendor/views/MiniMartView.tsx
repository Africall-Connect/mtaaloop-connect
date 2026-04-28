import { useEffect, useMemo, useState } from "react";
import type { Product, VendorWithProducts } from "@/types/database";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { MiniMartHero } from "@/components/vendor/minimart/MiniMartHero";
import { MiniMartStory } from "@/components/vendor/minimart/MiniMartStory";
import {
  MiniMartProductCard,
  MiniMartProductRow,
} from "@/components/vendor/minimart/MiniMartProductCard";

interface MiniMartViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

const SECTION_ORDER: Array<{ key: string; label: string }> = [
  { key: "staples", label: "Staples" },
  { key: "fresh", label: "Fresh" },
  { key: "snacks", label: "Snacks" },
  { key: "beverages", label: "Beverages" },
  { key: "household", label: "Household" },
  { key: "personal-care", label: "Personal Care" },
  { key: "baby-kids", label: "Baby & Kids" },
  { key: "airtime-bills", label: "Airtime & Bills" },
  { key: "other", label: "Other" },
];

const BLACK = "#000000";

type MartProduct = Product & {
  mart_aisle?: string | null;
  pack_size?: string | null;
};

export function MiniMartView({ vendor, products }: MiniMartViewProps) {
  const { addItem, getItemCount } = useCart();
  const storageKey = `grocery_list_mode_${vendor.id}`;
  const [listMode, setListMode] = useState<boolean>(false);

  // Load saved preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "true") setListMode(true);
    } catch { /* ignore */ }
  }, [storageKey]);

  const toggleList = () => {
    setListMode((v) => {
      const next = !v;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  const grouped = useMemo(() => {
    const g: Record<string, MartProduct[]> = {};
    for (const p of products as MartProduct[]) {
      const key = p.mart_aisle || "other";
      if (!g[key]) g[key] = [];
      g[key].push(p);
    }
    return g;
  }, [products]);

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
    toast.success("Added to basket", {
      description: `1x ${product.name}`,
    });
  };

  const cartCount = getItemCount();

  return (
    <div
      className="-mx-4 md:-mx-6 -my-6 md:-my-8 px-4 md:px-6 py-6 md:py-8"
      style={{
        background: "var(--vendor-surface)",
        color: BLACK,
        minHeight: "100vh",
      }}
    >
      <MiniMartHero
        vendor={vendor}
        itemCount={products.length}
        listMode={listMode}
        onToggleList={toggleList}
      />
      <MiniMartStory vendor={vendor} />

      <div className="space-y-8 md:space-y-12">
        {SECTION_ORDER.map(({ key, label }) => {
          const items = grouped[key];
          if (!items || items.length === 0) return null;
          return (
            <section key={key}>
              <h3
                className="uppercase mb-3"
                style={{
                  fontFamily: "var(--vendor-font-display)",
                  fontWeight: 800,
                  color: BLACK,
                  letterSpacing: "0.02em",
                  fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                  borderBottom: "4px solid var(--vendor-primary)",
                  paddingBottom: 4,
                  display: "inline-block",
                }}
              >
                {label}
              </h3>
              {listMode ? (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  style={{ borderTop: "1px solid #000" }}
                >
                  {items.map((product) => (
                    <MiniMartProductRow
                      key={product.id}
                      product={product}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {items.map((product) => (
                    <MiniMartProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {products.length === 0 && (
          <div
            className="text-center py-16"
            style={{ color: BLACK, opacity: 0.6 }}
          >
            Out of stock — back tomorrow.
          </div>
        )}
      </div>

      {/* Sticky basket bar — only shown in list mode for fast checkout */}
      {listMode && cartCount > 0 && (
        <div
          className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3 flex items-center justify-between"
          style={{
            background: BLACK,
            color: "var(--vendor-primary)",
            borderTop: "4px solid var(--vendor-primary)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
            className="uppercase text-sm"
          >
            {cartCount} in basket
          </span>
          <a
            href="/cart"
            className="px-4 py-2 text-sm uppercase"
            style={{
              background: "var(--vendor-primary)",
              color: BLACK,
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 800,
            }}
          >
            View basket
          </a>
        </div>
      )}

      <p
        className="mt-12 text-center text-xs"
        style={{
          color: BLACK,
          opacity: 0.55,
          fontFamily: "var(--vendor-font-display)",
          fontWeight: 600,
        }}
      >
        Mart yako, fast.
      </p>
    </div>
  );
}

export default MiniMartView;
