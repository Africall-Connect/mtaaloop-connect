import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star, Clock, MapPin } from "lucide-react";
import { VendorProfile } from "@/types/database";

interface VendorProfileGridProps {
  vendors: VendorProfile[];
  loading: boolean;
  error: string | null;
  category: string;
}

const VendorProfileGrid = ({ vendors, loading, error }: VendorProfileGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-40 bg-muted" />
            <div className="p-4">
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (vendors.length === 0) {
    return <p>No vendors found in this category.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <Link key={vendor.id} to={`/vendor/${vendor.slug}`}>
          <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300">
            <div className="relative h-40 overflow-hidden bg-muted">
              <img
                src={"https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGhhcm1hY3l8ZW58MHx8MHx8fDA%3D"}
                alt={vendor.business_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-1 truncate group-hover:text-primary">
                {vendor.business_name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 h-10 overflow-hidden">
                {vendor.business_description}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{vendor.rating?.toFixed(1) || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{vendor.delivery_time || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{vendor.business_address || "N/A"}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default VendorProfileGrid;
