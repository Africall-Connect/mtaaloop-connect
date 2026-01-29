import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Store, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

interface CategoryProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export const CategoryProductGrid = ({ 
  products, 
  emptyMessage = "No products found in this category" 
}: CategoryProductGridProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold mb-2">No Products Found</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent navigation when clicking add button
    
    if (!product.vendor) {
      toast({
        title: "Error",
        description: "Vendor information not available",
        variant: "destructive",
      });
      return;
    }

    addItem({
      id: product.id,
      vendorId: product.vendor_id,
      vendorName: product.vendor.business_name,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url || undefined,
      category: product.category,
    });

    toast({
      title: "Added to cart",
      description: `1x ${product.name}`,
    });
  };

  const handleProductClick = (product: Product) => {
    if (product.vendor?.slug) {
      navigate(`/vendor/${product.vendor.slug}`);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        return (
          <Card 
            key={product.id}
            className="overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg h-full flex flex-col group"
            onClick={() => handleProductClick(product)}
          >
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
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={!product.is_available}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {product.vendor && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <Store className="w-3 h-3" />
                    <span className="truncate">{product.vendor.business_name}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
