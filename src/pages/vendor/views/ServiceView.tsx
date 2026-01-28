import { Product, VendorWithProducts } from "@/types/database";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ServiceViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

export function ServiceView({ vendor, products }: ServiceViewProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const services = products.filter(p => p.item_type === 'service');

  return (
    <div>
      {services.length > 0 ? (
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Our Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: Product) => (
              <div key={service.id} className="bg-card border rounded-xl p-4 hover:shadow-lg transition-all flex flex-col">
                <div className="flex-grow">
                  <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-primary">KSh {service.price.toLocaleString()}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      addItem({
                        id: service.id,
                        vendorId: vendor.id,
                        vendorName: vendor.business_name,
                        name: service.name,
                        price: service.price,
                        quantity: 1,
                        image: service.image_url,
                      });
                      toast({
                        title: "Service added to cart",
                        description: `1x ${service.name}`,
                      });
                    }}
                  >
                    Request Service
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛠️</div>
          <h3 className="text-2xl font-bold mb-2">No Services Available</h3>
          <p className="text-muted-foreground">This vendor hasn't added any services yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
