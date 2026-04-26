import { Product } from "@/types/database";
import { Package } from "lucide-react";

interface LiquorProductCardProps {
  product: Product & { occasion_tag?: string | null; abv?: number | null };
  onAdd: (product: Product) => void;
}

const CREAM = "#F5E6D3";

const OCCASION_LABELS: Record<string, string> = {
  "friday-crew": "Friday Crew",
  "solo-wind-down": "Solo Wind-Down",
  "last-minute-gift": "Last-Minute Gift",
  "celebration": "Celebration",
  "cocktail-night": "Cocktail Night",
  "beer-run": "Beer Run",
  "other": "Other",
};

export function LiquorProductCard({ product, onAdd }: LiquorProductCardProps) {
  const occasionLabel =
    OCCASION_LABELS[product.occasion_tag ?? "other"] ?? "Other";

  return (
    <div
      className="group relative rounded-xl overflow-hidden flex flex-col transition-colors duration-300"
      style={{
        background:
          "color-mix(in srgb, var(--vendor-surface) 94%, white 6%)",
        border: `1px solid color-mix(in srgb, var(--vendor-accent) 15%, transparent)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          "color-mix(in srgb, var(--vendor-accent) 50%, transparent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          "color-mix(in srgb, var(--vendor-accent) 15%, transparent)";
      }}
    >
      {/* Image with vignette */}
      <div className="relative aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "color-mix(in srgb, var(--vendor-primary) 25%, transparent)",
            }}
          >
            <Package className="w-12 h-12" style={{ color: "var(--vendor-accent)", opacity: 0.4 }} />
          </div>
        )}
        {/* Bottom dark vignette */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          }}
        />

        {/* 18+ ribbon */}
        <span
          className="absolute top-2 right-2 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full"
          style={{
            background: "var(--vendor-primary)",
            color: CREAM,
            border: `1px solid color-mix(in srgb, var(--vendor-accent) 70%, transparent)`,
          }}
        >
          18+
        </span>

        {/* Occasion tag */}
        <span
          className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "color-mix(in srgb, var(--vendor-accent) 25%, transparent)",
            color: "var(--vendor-accent)",
          }}
        >
          {occasionLabel}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h4
          className="text-base md:text-lg leading-tight mb-1 line-clamp-2"
          style={{
            fontFamily: "var(--vendor-font-display)",
            fontWeight: 500,
            color: CREAM,
          }}
        >
          {product.name}
        </h4>

        {product.abv != null && (
          <p
            className="text-xs mb-3"
            style={{ color: CREAM, opacity: 0.6 }}
          >
            {product.abv}% ABV
          </p>
        )}

        <div className="flex items-end justify-between mt-auto pt-3 gap-3">
          <span
            className="text-lg md:text-xl"
            style={{
              fontFamily: "var(--vendor-font-display)",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
              color: "var(--vendor-accent)",
            }}
          >
            KSh {product.price.toLocaleString()}
          </span>
          <button
            onClick={() => onAdd(product)}
            className="rounded-md px-4 py-2 text-xs md:text-sm font-medium border transition-colors duration-300"
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
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquorProductCard;
