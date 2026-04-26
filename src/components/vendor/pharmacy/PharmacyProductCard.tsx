import { Pill, Droplets, Container, Wind, Package } from "lucide-react";
import { Product } from "@/types/database";
import { Button } from "@/components/ui/button";

interface PharmacyProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

/**
 * Map dosage_form to a lucide icon. Defensive: unknown forms get the generic Pill.
 */
function DosageIcon({ form }: { form?: string | null }) {
  const cls = "h-4 w-4";
  switch (form) {
    case "syrup":
      return <Container className={cls} />;
    case "cream":
      return <Package className={cls} />;
    case "drops":
      return <Droplets className={cls} />;
    case "inhaler":
      return <Wind className={cls} />;
    case "sachet":
      return <Package className={cls} />;
    case "pill":
    default:
      return <Pill className={cls} />;
  }
}

function dosageLabel(form?: string | null): string {
  if (!form || form === "other") return "Medicine";
  return form.charAt(0).toUpperCase() + form.slice(1);
}

export function PharmacyProductCard({
  product,
  onAdd,
}: PharmacyProductCardProps) {
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border transition-colors duration-200"
      style={{
        background: "#FFFFFF",
        borderColor:
          "color-mix(in srgb, var(--vendor-primary) 8%, transparent)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          "color-mix(in srgb, var(--vendor-primary) 25%, transparent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          "color-mix(in srgb, var(--vendor-primary) 8%, transparent)";
      }}
    >
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
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
                "color-mix(in srgb, var(--vendor-primary) 6%, transparent)",
              color: "var(--vendor-primary)",
            }}
          >
            <Pill className="h-12 w-12 opacity-50" />
          </div>
        )}

        {/* Rx badge */}
        {product.requires_prescription && (
          <span
            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide text-white"
            style={{ background: "var(--vendor-primary)" }}
          >
            Rx
          </span>
        )}

        {/* Dosage pictogram */}
        <span
          className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium shadow-sm"
          style={{ color: "var(--vendor-primary)" }}
          title={dosageLabel(product.dosage_form)}
        >
          <DosageIcon form={product.dosage_form} />
          {dosageLabel(product.dosage_form)}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h4 className="font-medium text-base leading-snug line-clamp-2">
          {product.name}
        </h4>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span
            className="text-base font-semibold"
            style={{ color: "var(--vendor-primary)" }}
          >
            KSh {product.price.toLocaleString()}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => onAdd(product)}
          disabled={product.requires_prescription}
          className="w-full text-white border-0"
          style={{
            background: product.requires_prescription
              ? "color-mix(in srgb, var(--vendor-primary) 35%, transparent)"
              : "var(--vendor-primary)",
          }}
        >
          {product.requires_prescription
            ? "Prescription required"
            : "Order this medicine"}
        </Button>
      </div>
    </div>
  );
}
