import { Plus, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveProductImage, productImageErrorHandler } from "@/lib/productImages";

interface ProductWithVendor {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category: string;
  subcategory?: string | null;
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
      <img
        src={resolveProductImage(product)}
        alt={product.name}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={productImageErrorHandler(product)}
      />

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
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#2563EB] text-white hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-300"
          onClick={(e) => onAddToCart(e, product)}
          disabled={!product.is_available}
        >
          <Plus className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  </Card>
);
