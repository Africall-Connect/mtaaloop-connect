import { Product, VendorWithProducts } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShoppingBasket } from "lucide-react";

interface InventoryViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

export function InventoryView({ vendor, products }: InventoryViewProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div>
      {products.length > 0 ? (
        Object.entries(groupedProducts).map(([category, productsInCategory]) => (
          <section key={category} className="mb-12">
            <h3 className="text-2xl font-bold mb-6 capitalize">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsInCategory.map((product: Product) => (
                <div key={product.id} className="bg-card border rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="relative">
                    <div className="aspect-square bg-muted overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-4xl text-muted-foreground">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      {product.is_popular && <Badge variant="default" className="bg-amber-500 text-white shadow-md">Popular</Badge>}
                      {product.is_new && <Badge variant="secondary" className="shadow-md">New</Badge>}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col">
                    <h4 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xl font-bold text-primary">KSh {product.price.toLocaleString()}</span>
                      <Button
                        size="icon"
                        className="rounded-full"
                        onClick={() => {
                          addItem({
                            id: product.id,
                            vendorId: vendor.id,
                            vendorName: vendor.business_name,
                            name: product.name,
                            price: product.price,
                            quantity: 1,
                            image: product.image_url,
                          });
                          toast({
                            title: "Added to cart",
                            description: `1x ${product.name}`,
                          });
                        }}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="text-center py-20 bg-muted/50 rounded-xl">
          <ShoppingBasket className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-bold mb-2">The Shelves are Bare!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">This vendor is busy cooking up something new. Please check back later for delicious updates!</p>
        </div>
      )}
    </div>
  );
}
