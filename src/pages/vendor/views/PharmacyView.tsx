import { useState, useEffect } from "react";
import { Product, VendorWithProducts } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pill, CalendarClock, ShoppingBasket, Stethoscope } from "lucide-react";

interface PharmacyViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

interface BookingSlot {
  id: string;
  product_id: string;
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

export function PharmacyView({ vendor, products }: PharmacyViewProps) {
  const [activeTab, setActiveTab] = useState<string>("products");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Split products by item_type
  const inventoryProducts = products.filter(p => p.item_type !== 'booking');
  const bookingProducts = products.filter(p => p.item_type === 'booking');

  // Group inventory products by subcategory
  const groupedProducts = inventoryProducts.reduce((acc, product) => {
    const category = product.subcategory || product.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Fetch booking slots when consultation tab is active
  useEffect(() => {
    const fetchBookingSlots = async () => {
      if (bookingProducts.length === 0) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('booking_slots')
        .select('*')
        .in('product_id', bookingProducts.map(b => b.id))
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching booking slots:', error);
      } else {
        setBookingSlots(data || []);
      }
      setLoading(false);
    };

    if (activeTab === 'consultations') {
      fetchBookingSlots();
    }
  }, [activeTab, bookingProducts]);

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

  const handleBookSlot = (slot: BookingSlot) => {
    const product = bookingProducts.find(b => b.id === slot.product_id);
    if (product) {
      addItem({
        id: slot.id,
        vendorId: vendor.id,
        vendorName: vendor.business_name,
        name: product.name,
        price: product.price,
        quantity: 1,
        bookingDetails: {
          slot_start: slot.slot_start,
          slot_end: slot.slot_end,
        },
      });
      toast({
        title: "Consultation booked",
        description: `${product.name} added to cart`,
      });
    }
  };

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
                            <Badge variant="default" className="bg-amber-500 text-white shadow-md">
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
          {bookingProducts.length > 0 ? (
            <section className="mb-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Available Consultations
              </h3>
              
              {/* Consultation Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {bookingProducts.map((service) => (
                  <div 
                    key={service.id}
                    className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{service.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            KSh {service.price.toLocaleString()}
                          </span>
                          {service.duration && (
                            <Badge variant="outline">
                              {service.duration} min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calendar and Slots */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-card border rounded-xl p-4">
                  <h4 className="font-semibold mb-4">Select Date</h4>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md"
                    disabled={(date) => date < new Date()}
                  />
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-semibold mb-4">Available Time Slots</h4>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : bookingSlots.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {bookingSlots.map((slot) => {
                        const service = bookingProducts.find(b => b.id === slot.product_id);
                        return (
                          <div 
                            key={slot.id} 
                            className="bg-card border rounded-xl p-4 flex justify-between items-center hover:border-primary transition-colors"
                          >
                            <div>
                              <p className="font-semibold">
                                {new Date(slot.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.slot_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {service?.name}
                              </p>
                            </div>
                            <Button onClick={() => handleBookSlot(slot)}>
                              Book Now
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-xl">
                      <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Slots Available</h4>
                      <p className="text-muted-foreground">
                        No consultation slots available for this date. Try another date.
                      </p>
                    </div>
                  )}
                </div>
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
    </div>
  );
}
