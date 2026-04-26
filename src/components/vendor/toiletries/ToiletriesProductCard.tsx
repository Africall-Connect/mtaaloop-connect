import { Package } from "lucide-react";
import type { Product } from "@/types/database";

const PLUM = "#3D2B2B";

interface Props {
  product: Product & {
    skin_type?: string | null;
    pack_size?: string | null;
    refill_cadence_days?: number | null;
  };
  onAdd: (product: Product) => void;
}

const SKIN_LABEL: Record<string, string> = {
  oily: "Oily",
  dry: "Dry",
  combination: "Combination",
  sensitive: "Sensitive",
};

function refillString(days?: number | null): string | null {
  if (!days) return null;
  if (days <= 14) return "Most reorder in ~2 weeks";
  if (days <= 24) return "Most reorder in ~3 weeks";
  if (days <= 35) return "Most reorder monthly";
  if (days <= 50) return "Most reorder in ~6 weeks";
  return "Most reorder seasonally";
}

export function ToiletriesProductCard({ product, onAdd }: Props) {
  const skin = product.skin_type;
  const showSkinChip = skin && skin !== "na" && skin !== "all-skin";
  const refill = refillString(product.refill_cadence_days);

  return (
    <article
      className="group bg-white overflow-hidden flex flex-col transition-all duration-[250ms]"
      style={{
        borderRadius: "1rem",
        border:
          "1px solid color-mix(in srgb, var(--vendor-primary) 20%, transparent)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          "color-mix(in srgb, var(--vendor-primary) 50%, transparent)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          "color-mix(in srgb, var(--vendor-primary) 20%, transparent)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="relative bg-white aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12" style={{ color: "var(--vendor-primary)", opacity: 0.4 }} />
          </div>
        )}

        {showSkinChip && (
          <span
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: "color-mix(in srgb, var(--vendor-primary) 30%, white)",
              color: PLUM,
            }}
          >
            {SKIN_LABEL[skin!] ?? skin}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h4
          className="text-sm leading-snug line-clamp-2"
          style={{ fontFamily: "var(--vendor-font-display)", fontWeight: 400, color: PLUM }}
        >
          {product.name}
        </h4>

        <div className="flex items-end justify-between mt-auto pt-1">
          <div className="flex flex-col gap-0.5">
            <span
              className="text-base font-bold tabular-nums"
              style={{ color: "var(--vendor-primary)" }}
            >
              KSh {product.price.toLocaleString()}
            </span>
            {product.pack_size && (
              <span className="text-[11px]" style={{ color: PLUM, opacity: 0.6 }}>
                {product.pack_size}
              </span>
            )}
          </div>
          {refill && (
            <span
              className="text-[10px] text-right max-w-[7rem] leading-tight"
              style={{ color: PLUM, opacity: 0.55 }}
            >
              {refill}
            </span>
          )}
        </div>

        <button
          onClick={() => onAdd(product)}
          className="mt-1 w-full py-2 rounded-full text-sm font-medium transition-colors duration-200"
          style={{ background: "var(--vendor-primary)", color: PLUM }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "color-mix(in srgb, var(--vendor-primary) 85%, black)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--vendor-primary)")
          }
        >
          Add to bag
        </button>
      </div>
    </article>
  );
}

export default ToiletriesProductCard;
