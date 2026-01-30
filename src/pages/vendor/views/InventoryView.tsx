import { Product, VendorWithProducts } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShoppingBasket, Package } from "lucide-react";

interface InventoryViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

export function InventoryView({ vendor, products }: InventoryViewProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.subcategory || product.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      vendorId: vendor.id,
      vendorName: vendor.business_name,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url || undefined,
    });
    toast({
      title: "Added to cart",
      description: `1x ${product.name}`,
    });
  };

  return (
    <div>
      {products.length > 0 ? (
        Object.entries(groupedProducts).map(([category, productsInCategory]) => (
          <section key={category} className="mb-10 md:mb-12">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold capitalize">{category}</h3>
              <Badge variant="secondary" className="ml-auto">
                {productsInCategory.length} item{productsInCategory.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {productsInCategory.map((product: Product) => (
                <Card 
                  key={product.id} 
                  className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50"
                >
                  <div className="relative">
                    <div className="aspect-square bg-muted overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Package className="w-12 h-12 md:w-16 md:h-16 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {product.is_popular && (
                        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white shadow-md text-xs">
                          Popular
                        </Badge>
                      )}
                      {product.is_new && (
                        <Badge variant="secondary" className="shadow-md text-xs">New</Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 flex flex-col">
                    <h4 className="font-semibold text-sm md:text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2 flex-grow">
                      {product.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-base md:text-xl font-bold text-primary">
                        KSh {product.price.toLocaleString()}
                      </span>
                      <Button
                        size="icon"
                        className="rounded-full h-8 w-8 md:h-10 md:w-10 shadow-md"
                        onClick={() => handleAddToCart(product)}
                      >
                        <Plus className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="text-center py-16 md:py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingBasket className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">No Products Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto px-4">
            {vendor.business_name} is busy adding new items. Check back soon for exciting products!
          </p>
        </div>
      )}
    </div>
  );
}
