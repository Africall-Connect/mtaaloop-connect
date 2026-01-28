import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star, Clock, MapPin } from "lucide-react";
import { Vendor } from "@/data/vendors";

interface VendorListingGridProps {
  vendors: Vendor[];
  emptyMessage?: string;
}

export const VendorListingGrid = ({ vendors, emptyMessage = "No vendors found in this category" }: VendorListingGridProps) => {
  if (vendors.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold mb-2">No Vendors Found</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {vendors.map((vendor) => (
        <Link key={vendor.id} to={`/vendor/${vendor.id}`}>
          <Card className="group overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg">
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img
                src={vendor.images[0] || "/placeholder.svg"}
                alt={vendor.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                {vendor.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                {vendor.tagline || vendor.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{vendor.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{vendor.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{vendor.distance}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};
