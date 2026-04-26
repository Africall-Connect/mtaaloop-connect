import { useState } from "react";
import { Plus, Package } from "lucide-react";
import type { Product } from "@/types/database";

const BLACK = "#000000";
const YELLOW = "var(--vendor-primary)";

type MartProduct = Product & {
  pack_size?: string | null;
};

interface Props {
  product: MartProduct;
  onAdd: (product: Product) => void;
}

export function MiniMartProductCard({ product, onAdd }: Props) {
  const [pulse, setPulse] = useState(false);
  const isLow =
    product.stock_quantity != null &&
    product.stock_quantity > 0 &&
    product.stock_quantity < 10;

  const handleAdd = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 180);
    onAdd(product);
  };

  return (
    <article
      className="bg-white flex flex-col"
      style={{ border: "2px solid #000" }}
    >
      <div className="relative bg-white aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12" style={{ color: BLACK, opacity: 0.2 }} />
          </div>
        )}

        {product.pack_size && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 text-[10px]"
            style={{
              background: YELLOW,
              color: BLACK,
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 700,
            }}
          >
            {product.pack_size}
          </span>
        )}

        {isLow && (
          <div
            className="absolute top-0 right-0 px-3 py-1 text-[10px] uppercase"
            style={{
              background: BLACK,
              color: YELLOW,
              fontFamily: "var(--vendor-font-display)",
              fontWeight: 800,
              letterSpacing: "0.05em",
              transform: "translate(0, 0)",
            }}
          >
            Few left
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <h4
          className="text-sm truncate"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 700,
            color: BLACK,
          }}
          title={product.name}
        >
          {product.name}
        </h4>
        <div className="flex items-baseline justify-between">
          <span style={{ color: BLACK, fontFamily: "var(--vendor-font-display)" }}>
            <span className="text-xs" style={{ fontWeight: 500, opacity: 0.7 }}>
              KSh{" "}
            </span>
            <span
              className="text-lg tabular-nums"
              style={{ fontWeight: 800, letterSpacing: "-0.01em" }}
            >
              {product.price.toLocaleString()}
            </span>
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="w-full py-2 uppercase text-xs"
          style={{
            background: YELLOW,
            color: BLACK,
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 800,
            letterSpacing: "0.04em",
            transform: pulse ? "scale(0.95)" : "scale(1)",
            transition: "transform 100ms ease-out",
          }}
        >
          Add to basket
        </button>
      </div>
    </article>
  );
}

interface RowProps {
  product: MartProduct;
  onAdd: (product: Product) => void;
}

export function MiniMartProductRow({ product, onAdd }: RowProps) {
  const [pulse, setPulse] = useState(false);
  const handleAdd = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 160);
    onAdd(product);
  };
  return (
    <div
      className="flex items-center gap-3 px-2 py-2 bg-white"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.15)" }}
    >
      <div
        className="shrink-0 bg-white"
        style={{ width: 48, height: 48, border: "1px solid #000" }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-5 w-5" style={{ color: BLACK, opacity: 0.3 }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm truncate"
          style={{ fontFamily: "var(--vendor-font-display)", fontWeight: 700, color: BLACK }}
        >
          {product.name}
        </div>
        {product.pack_size && (
          <div
            className="text-[11px]"
            style={{ color: BLACK, opacity: 0.6 }}
          >
            {product.pack_size}
          </div>
        )}
      </div>
      <div
        className="text-right tabular-nums"
        style={{
          fontFamily: "var(--vendor-font-display)",
          fontWeight: 800,
          color: BLACK,
        }}
      >
        <span className="text-[10px] opacity-60">KSh </span>
        {product.price.toLocaleString()}
      </div>
      <button
        onClick={handleAdd}
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          background: BLACK,
          color: YELLOW,
          transform: pulse ? "scale(0.92)" : "scale(1)",
          transition: "transform 100ms ease-out",
        }}
        aria-label={`Add ${product.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
