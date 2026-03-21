import { Store, Star, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop";

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
  };
  onClick: () => void;
}

export const VendorShowcaseCard = ({ vendor, onClick }: VendorShowcaseProps) => (
  <Card
    className="overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
    onClick={onClick}
  >
    <div className="relative h-32 sm:h-40 overflow-hidden bg-muted">
      <img
        src={vendor.cover_image_url || vendor.logo_url || FALLBACK_IMG}
        alt={vendor.business_name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Status badge */}
      <Badge
        className={`absolute top-2 right-2 text-[10px] ${
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
        className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm capitalize"
      >
        {vendor.business_type?.replace(/-/g, " ") || vendor.operational_category}
      </Badge>

      {/* Logo overlay */}
      {vendor.logo_url && vendor.cover_image_url && (
        <div className="absolute bottom-2 left-2 w-10 h-10 rounded-lg overflow-hidden border-2 border-background shadow-md bg-background">
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
