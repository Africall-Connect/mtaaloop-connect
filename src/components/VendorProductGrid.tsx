import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Store } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  vendor_id: string;
  category: string;
  subcategory: string | null;
  vendor?: {
    business_name: string;
    slug: string;
  };
}

interface VendorProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export const VendorProductGrid = ({ 
  products, 
  emptyMessage = "No products found in this category" 
}: VendorProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold mb-2">No Products Found</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        // For database vendors, we need to use the slug in the VendorHome route
        // VendorDetail is for mock data, VendorHome is for database vendors
        const vendorLink = product.vendor?.slug 
          ? `/vendor/${product.vendor.slug}` 
          : `/vendor/${product.vendor_id}`;
        
        return (
          <Link 
            key={product.id} 
            to={vendorLink}
            className="group"
          >
          <Card className="overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg h-full flex flex-col">
            <div className="aspect-square relative overflow-hidden bg-muted">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🍽️
                </div>
              )}
              {!product.is_available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive">Out of Stock</Badge>
                </div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2 flex-1">
                  {product.description}
                </p>
              )}
              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-primary">
                    KES {product.price.toLocaleString()}
                  </span>
                  <ShoppingCart className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {product.vendor && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Store className="w-3 h-3" />
                    <span className="truncate">{product.vendor.business_name}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
          </Link>
        );
      })}
    </div>
  );
};
