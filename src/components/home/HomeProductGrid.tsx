import { HomeProductCard } from "./HomeProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PackageSearch } from "lucide-react";

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

interface HomeProductGridProps {
  products: ProductWithVendor[];
  loading: boolean;
  selectedCategory: string | null;
  onAddToCart: (e: React.MouseEvent, product: ProductWithVendor) => void;
  onProductClick: (product: ProductWithVendor) => void;
}

export const HomeProductGrid = ({
  products,
  loading,
  selectedCategory,
  onAddToCart,
  onProductClick,
}: HomeProductGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-2 sm:p-3 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <PackageSearch className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-medium text-foreground mb-1">No products found</h3>
        <p className="text-sm text-muted-foreground">
          {selectedCategory 
            ? `No products available in "${selectedCategory}". Try another category!`
            : "Check back soon for new products!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {products.map((product) => (
        <HomeProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onProductClick={onProductClick}
        />
      ))}
    </div>
  );
};
