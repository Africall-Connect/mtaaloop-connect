import { useState, useEffect, useRef } from "react";
import { Store, Star, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop";

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
    rating: number;
    delivery_time: string | null;
    product_count?: number;
    featured_products?: ProductPreview[];
  };
  onClick: () => void;
}

export const VendorShowcaseCard = ({ vendor, onClick }: VendorShowcaseProps) => {
  const products = vendor.featured_products || [];
  const hasCarousel = products.length > 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll carousel
  useEffect(() => {
    if (products.length <= 1) return;
    autoRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % products.length);
    }, 3000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [products.length]);

  // Scroll to active image
  useEffect(() => {
    if (!scrollRef.current || !hasCarousel) return;
    const child = scrollRef.current.children[activeIdx] as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIdx, hasCarousel]);

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

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative h-32 sm:h-40 overflow-hidden bg-muted">
        {hasCarousel ? (
          <>
            {/* Product image carousel */}
            <div ref={scrollRef} className="flex w-full h-full overflow-hidden">
              {products.map((p, i) => (
                <img
                  key={p.id}
                  src={p.image_url || FALLBACK_IMG}
                  alt={p.name}
                  className={`w-full h-full object-cover flex-shrink-0 transition-opacity duration-500 absolute inset-0 ${
                    i === activeIdx ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                />
              ))}
            </div>

            {/* Product name overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-[10px] sm:text-xs text-white font-medium line-clamp-1">
                {products[activeIdx]?.name}
              </p>
              <p className="text-[10px] text-white/70">
                KES {products[activeIdx]?.price.toLocaleString()}
              </p>
            </div>

            {/* Carousel arrows */}
            {products.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Dots */}
            {products.length > 1 && products.length <= 8 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1">
                {products.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIdx ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <img
              src={vendor.cover_image_url || vendor.logo_url || FALLBACK_IMG}
              alt={vendor.business_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        )}

        {/* Status badge */}
        <Badge
          className={`absolute top-2 right-2 text-[10px] z-20 ${
            vendor.is_open
              ? "bg-emerald-600 text-white"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {vendor.is_open ? "Open" : "Closed"}
        </Badge>

        {/* Category badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm capitalize z-20"
        >
          {vendor.business_type?.replace(/-/g, " ") || vendor.operational_category}
        </Badge>

        {/* Logo overlay */}
        {vendor.logo_url && (
          <div className="absolute bottom-2 left-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border-2 border-background shadow-md bg-background z-20">
            <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors mb-0.5">
          {vendor.business_name}
        </h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mb-2">
          {vendor.tagline || "Shop with us today"}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
            {vendor.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {vendor.rating.toFixed(1)}
              </span>
            )}
            {vendor.delivery_time && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {vendor.delivery_time}
              </span>
            )}
            {(vendor.product_count ?? 0) > 0 && (
              <span>{vendor.product_count} items</span>
            )}
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-primary">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
