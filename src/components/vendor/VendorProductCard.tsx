import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  discount?: number;
  originalPrice?: number;
}

interface VendorProductCardProps {
  product: Product;
  onClick: () => void;
}

export function VendorProductCard({ product, onClick }: VendorProductCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {product.discount && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
            -{product.discount}%
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-primary">
            KSh {product.price}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              KSh {product.originalPrice}
            </span>
          )}
        </div>

        <Button 
          size="sm" 
          className="w-full bg-[#2563EB] text-white hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-300"
          onClick={(e) => {
            e.stopPropagation();
            // Will trigger parent onClick instead
          }}
        >
          <Plus className="h-4 w-4 mr-1 text-white" />
          Add
        </Button>
      </div>
    </div>
  );
}