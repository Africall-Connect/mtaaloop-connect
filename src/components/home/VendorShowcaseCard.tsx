import { useState, useEffect, useRef } from "react";
import { Store, Star, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isVendorCurrentlyOpen } from "@/lib/vendorHours";

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
    open_hours?: string | null;
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
  const [activeIdx, setActiveIdx] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentlyOpen = isVendorCurrentlyOpen(vendor.open_hours, vendor.is_open);

  useEffect(() => {
    if (products.length <= 1) return;
    autoRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % products.length);
    }, 3000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [products.length]);

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
      className="overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-400 group hover:-translate-y-1.5 bg-card"
      onClick={onClick}
    >
      {/* Image area */}
      <div className="relative h-36 sm:h-44 overflow-hidden bg-muted">
        {hasCarousel ? (
          <>
            {products.map((p, i) => (
              <img
                key={p.id}
                src={p.image_url || FALLBACK_IMG}
                alt={p.name}
                className={`w-full h-full object-cover absolute inset-0 transition-all duration-700 ease-out ${
                  i === activeIdx ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                loading="lazy"
              />
            ))}

            {/* Product info overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
              <p className="text-[11px] sm:text-xs text-white font-medium line-clamp-1">
                {products[activeIdx]?.name}
              </p>
              <p className="text-[10px] text-white/70 font-medium">
                KES {products[activeIdx]?.price.toLocaleString()}
              </p>
            </div>

            {/* Nav arrows */}
            {products.length > 1 && (
              <>
                <button onClick={goPrev}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                  aria-label="Previous">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={goNext}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                  aria-label="Next">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {products.length > 1 && products.length <= 8 && (
              <div className="absolute bottom-[52px] left-1/2 -translate-x-1/2 z-20 flex gap-1">
                {products.map((_, i) => (
                  <span key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIdx ? "w-4 h-1.5 bg-primary shadow-sm" : "w-1.5 h-1.5 bg-white/40"
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
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </>
        )}

        {/* Status badge */}
        <Badge className={`absolute top-2 right-2 text-[10px] font-semibold z-20 border-0 ${
          currentlyOpen ? "bg-emerald-600 text-white shadow-sm" : "bg-destructive text-destructive-foreground"
        }`}>
          {currentlyOpen ? "Open" : "Closed"}
        </Badge>

        {/* Category badge */}
        <Badge variant="secondary"
          className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-md capitalize z-20 font-medium border-0">
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
        <h3 className="font-bold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors leading-tight">
          {vendor.business_name}
        </h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5 mb-2.5">
          {vendor.tagline || "Shop with us today"}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[10px] sm:text-xs text-muted-foreground">
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
            {(vendor.product_count ?? 0) > 0 && (
              <span className="text-muted-foreground">{vendor.product_count} items</span>
            )}
          </div>
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Card>
  );
};
