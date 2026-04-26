import { useState, useEffect, useRef, CSSProperties } from "react";
import { Star, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isVendorCurrentlyOpen } from "@/lib/vendorHours";

interface ProductPreview {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
}

interface VendorShowcaseProps {
  vendor: {
    id: string;
    business_name: string;
    slug: string;
    logo_url: string | null;
    cover_image_url: string | null;
    tagline: string | null;
    business_type: string;
    operational_category: string;
    is_open: boolean;
    open_hours?: string | null;
    rating: number;
    delivery_time: string | null;
    product_count?: number;
    featured_products?: ProductPreview[];
    brand_primary?: string | null;
    brand_surface?: string | null;
    font_display?: string | null;
  };
  onClick: () => void;
}

const FONT_STACKS: Record<string, string> = {
  "inter-tight": "'Inter Tight', system-ui, sans-serif",
  fraunces: "'Fraunces', Georgia, serif",
  archivo: "'Archivo', system-ui, sans-serif",
};

const DEFAULT_PRIMARY = "#1E2A78";
const CREAM_SURFACE = "#F7F3EC";

export const VendorShowcaseCard = ({ vendor, onClick }: VendorShowcaseProps) => {
  const products = (vendor.featured_products || []).filter(p => !!p.image_url);
  const hasCarousel = !!vendor.cover_image_url || products.length > 0;
  const [activeIdx, setActiveIdx] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentlyOpen = isVendorCurrentlyOpen(vendor.open_hours, vendor.is_open);

  const brandPrimary = vendor.brand_primary || DEFAULT_PRIMARY;
  const fontKey = vendor.font_display ?? "default";
  const fontStack = FONT_STACKS[fontKey];

  // Build collage from up to 4 product images (used when no cover_image_url)
  const collage = products.slice(0, 4);

  useEffect(() => {
    if (!vendor.cover_image_url && products.length <= 1) return;
    if (vendor.cover_image_url) return; // single static cover, no rotation
    autoRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % Math.max(products.length, 1));
    }, 3500);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [vendor.cover_image_url, products.length]);

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (autoRef.current) clearInterval(autoRef.current);
    setActiveIdx(prev => (prev + 1) % products.length);
  };
  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (autoRef.current) clearInterval(autoRef.current);
    setActiveIdx(prev => (prev - 1 + products.length) % products.length);
  };

  const cardStyle: CSSProperties = {
    backgroundColor: CREAM_SURFACE,
    borderTop: `4px solid ${brandPrimary}`,
  };

  const itemCount = vendor.product_count ?? 0;

  return (
    <Card
      className="overflow-hidden cursor-pointer border border-border/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
      style={cardStyle}
      onClick={onClick}
    >
      {/* Image area */}
      <div className="relative h-36 sm:h-44 overflow-hidden bg-muted">
        {vendor.cover_image_url ? (
          <img
            src={vendor.cover_image_url}
            alt={vendor.business_name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
          />
        ) : products.length > 0 ? (
          <>
            {/* If exactly one image, just show it. Otherwise rotating carousel. */}
            {products.length === 1 ? (
              <img
                src={products[0].image_url || ""}
                alt={products[0].name}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <>
                {products.map((p, i) => (
                  <img
                    key={p.id}
                    src={p.image_url || ""}
                    alt={p.name}
                    className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ease-out ${
                      i === activeIdx ? "opacity-100" : "opacity-0"
                    }`}
                    loading="lazy"
                  />
                ))}

                {products.length > 1 && (
                  <>
                    <button
                      onClick={goPrev}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={goNext}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                      aria-label="Next"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          /* No cover, no product images: solid tinted block with first letter */
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              backgroundColor: brandPrimary,
              backgroundImage: `linear-gradient(135deg, ${brandPrimary}1F, ${brandPrimary}14)`,
            }}
          >
            <span
              className="text-6xl font-bold select-none"
              style={{
                color: brandPrimary,
                fontFamily: fontStack || "inherit",
              }}
            >
              {vendor.business_name?.trim().charAt(0).toUpperCase() || "·"}
            </span>
          </div>
        )}

        {/* Status badge */}
        <Badge
          className={`absolute top-2 right-2 text-[10px] font-semibold z-20 border-0 ${
            currentlyOpen
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {currentlyOpen ? "Open" : "Closed"}
        </Badge>

        {/* Category badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-[10px] bg-background/85 backdrop-blur-md capitalize z-20 font-medium border-0"
        >
          {vendor.business_type?.replace(/-/g, " ") || vendor.operational_category}
        </Badge>

        {/* Logo */}
        {vendor.logo_url && (
          <div className="absolute bottom-2 left-2 w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border-2 border-background shadow-md bg-background z-20">
            <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3.5">
        <h3
          className="font-bold text-sm sm:text-base line-clamp-1 leading-tight text-foreground"
          style={fontStack ? { fontFamily: fontStack } : undefined}
        >
          {vendor.business_name}
        </h3>

        {/* Tagline only if it exists. No generic placeholder. */}
        {vendor.tagline && (
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {vendor.tagline}
          </p>
        )}

        <div className="flex items-center gap-2.5 text-[10px] sm:text-xs text-muted-foreground mt-2.5 flex-wrap">
          {vendor.rating > 0 && (
            <span className="flex items-center gap-0.5 font-medium">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {vendor.rating.toFixed(1)}
            </span>
          )}
          {vendor.delivery_time && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {vendor.delivery_time}
            </span>
          )}
          <span className="text-muted-foreground">
            {itemCount > 0 ? `${itemCount} items` : "Coming soon"}
          </span>
        </div>
      </div>
    </Card>
  );
};
