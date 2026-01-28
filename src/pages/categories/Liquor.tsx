import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVendorsByCategory } from "@/data/vendors";

const Liquor = () => {
  const liquorVendors = getVendorsByCategory("Liquor & Wines");
  const khatVendors = getVendorsByCategory("Jaba (Miraa)");
  const vendors = [...liquorVendors, ...khatVendors];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🍺 Liquor Store</h1>
            <p className="text-muted-foreground">Beer, wine, spirits & more</p>
          </div>
        </div>

        <div className="space-y-4">
          {vendors.map((vendor) => (
            <Link key={vendor.id} to={`/vendor/${vendor.slug}`}>
              <Card className="p-6 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                <div className="flex items-start gap-4">
                  <img
                    src={vendor.logo || vendor.images[0]}
                    alt={vendor.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{vendor.name}</h3>
                    <p className="text-muted-foreground mb-2">{vendor.tagline}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>⭐ {vendor.rating} ({vendor.reviewCount} reviews)</span>
                      <span>📍 {vendor.distance}</span>
                      <span>🚚 {vendor.deliveryTime}</span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-primary mt-2">
                      View menu →
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Liquor;
