import { useState, useEffect } from "react";
import { Product, VendorWithProducts } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ConsultationBookingFlow } from "@/components/pharmacy/ConsultationBookingFlow";
import { ConsultationType } from "@/types/consultation";
import { Plus, Pill, CalendarClock, ShoppingBasket, Stethoscope, Clock, ArrowRight } from "lucide-react";

interface PharmacyViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

export function PharmacyView({ vendor, products }: PharmacyViewProps) {
  const [activeTab, setActiveTab] = useState<string>("products");
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Only show inventory products (not bookings - those are handled by consultation system)
  const inventoryProducts = products.filter(p => p.item_type !== 'booking');

  // Group inventory products by subcategory
  const groupedProducts = inventoryProducts.reduce((acc, product) => {
    const category = product.subcategory || product.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Fetch consultation types to check if vendor offers consultations
  useEffect(() => {
    const fetchConsultationTypes = async () => {
      const { data, error } = await supabase
        .from('consultation_types')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true);

      if (!error && data) {
        setConsultationTypes(data as unknown as ConsultationType[]);
      }
    };

    fetchConsultationTypes();
  }, [vendor.id]);

  const handleAddProduct = (product: Product) => {
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
  };

  const hasConsultations = consultationTypes.length > 0;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
          <TabsTrigger value="products" className="gap-2">
            <Pill className="h-4 w-4" />
            Shop Products
          </TabsTrigger>
          <TabsTrigger value="consultations" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Book Consultation
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-0">
          {inventoryProducts.length > 0 ? (
            Object.entries(groupedProducts).map(([category, productsInCategory]) => (
              <section key={category} className="mb-12">
                <h3 className="text-2xl font-bold mb-6 capitalize flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {productsInCategory.map((product: Product) => (
                    <div 
                      key={product.id} 
                      className="bg-card border rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
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
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <Pill className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                          {product.is_popular && (
                            <Badge className="shadow-md">
                              Popular
                            </Badge>
                          )}
                          {product.is_new && (
                            <Badge variant="secondary" className="shadow-md">
                              New
                            </Badge>
                          )}
                          {product.requires_prescription && (
                            <Badge variant="destructive" className="shadow-md">
                              Rx Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col">
                        <h4 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xl font-bold text-primary">
                            KSh {product.price.toLocaleString()}
                          </span>
                          <Button
                            size="icon"
                            className="rounded-full"
                            onClick={() => handleAddProduct(product)}
                            disabled={product.requires_prescription}
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
              <h3 className="text-2xl font-bold mb-2">No Products Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This pharmacy hasn't added any products yet. Check back later!
              </p>
            </div>
          )}
        </TabsContent>

        {/* Consultations Tab */}
        <TabsContent value="consultations" className="mt-0">
          {hasConsultations ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Available Consultations
                </h3>
              </div>
              
              {/* Consultation Types Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {consultationTypes.map((consultation) => (
                  <div 
                    key={consultation.id}
                    className="bg-card border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full shrink-0">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-lg">{consultation.name}</h4>
                          {consultation.requires_prescription && (
                            <Badge variant="outline" className="shrink-0 gap-1">
                              <Pill className="h-3 w-3" />
                              Rx
                            </Badge>
                          )}
                        </div>
                        {consultation.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {consultation.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {consultation.duration_minutes} min
                          </div>
                          <div className="text-lg font-bold text-primary">
                            KSh {consultation.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Book Now CTA */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-lg">Ready to book?</h4>
                  <p className="text-muted-foreground">
                    Choose a consultation type, select your preferred time, and provide health details.
                  </p>
                </div>
                <Button size="lg" onClick={() => setShowBookingFlow(true)} className="gap-2 shrink-0">
                  Book Consultation
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          ) : (
            <div className="text-center py-20 bg-muted/50 rounded-xl">
              <Stethoscope className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Consultations Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This pharmacy doesn't offer consultation services yet. Check back later!
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Consultation Booking Flow Dialog */}
      <Dialog open={showBookingFlow} onOpenChange={setShowBookingFlow}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ConsultationBookingFlow
            vendor={{
              id: vendor.id,
              business_name: vendor.business_name,
              business_address: vendor.business_address,
              logo_url: vendor.logo_url,
              rating: vendor.rating,
            }}
            onClose={() => setShowBookingFlow(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
