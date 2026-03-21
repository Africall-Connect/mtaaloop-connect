import { Plus, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop";

interface ProductWithVendor {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category: string;
  vendor_id: string;
  vendor: {
    business_name: string;
    slug: string;
  };
}

interface HomeProductCardProps {
  product: ProductWithVendor;
  onAddToCart: (e: React.MouseEvent, product: ProductWithVendor) => void;
  onProductClick: (product: ProductWithVendor) => void;
}

export const HomeProductCard = ({
  product,
  onAddToCart,
  onProductClick,
}: HomeProductCardProps) => (
  <Card
    className="overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
    onClick={() => onProductClick(product)}
  >
    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      
      {/* Category Badge */}
      <Badge 
        variant="secondary" 
        className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm"
      >
        {product.category}
      </Badge>

      {!product.is_available && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
        </div>
      )}
    </div>
    
    <div className="p-2 sm:p-3">
      <h3 className="font-medium text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors mb-1">
        {product.name}
      </h3>
      
      <div className="flex items-center justify-between">
        <span className="text-sm sm:text-base font-bold text-primary">
          KES {product.price.toLocaleString()}
        </span>
        <Button
          size="icon"
          variant="default"
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
          onClick={(e) => onAddToCart(e, product)}
          disabled={!product.is_available}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1">
        <Store className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        <span className="truncate">{product.vendor.business_name}</span>
      </div>
    </div>
  </Card>
);
