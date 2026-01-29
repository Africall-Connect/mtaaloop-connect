import { Product, VendorWithProducts } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface BookingViewProps {
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

export function BookingView({ vendor, products }: BookingViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();

  const bookings = products.filter(p => p.item_type === 'booking');

  useEffect(() => {
    const fetchBookingSlots = async () => {
      if (bookings.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('booking_slots')
        .select('*')
        .in('product_id', bookings.map(b => b.id));

      if (error) {
        console.error('Error fetching booking slots:', error);
      } else {
        setBookingSlots(data);
      }
      setLoading(false);
    };

    fetchBookingSlots();
  }, [products, bookings]);

  return (
    <div>
      {bookings.length > 0 ? (
        <section className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Book a Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            <div className="md:col-span-2">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {bookingSlots.map(slot => (
                    <div key={slot.id} className="bg-card border rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{new Date(slot.slot_start).toLocaleTimeString()} - {new Date(slot.slot_end).toLocaleTimeString()}</p>
                        <p className="text-sm text-muted-foreground">{bookings.find(b => b.id === slot.product_id)?.name}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const product = bookings.find(b => b.id === slot.product_id);
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
                              title: "Booking added to cart",
                              description: `1x ${product.name}`,
                            });
                          }
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold mb-2">No Booking Services Available</h3>
          <p className="text-muted-foreground">This vendor hasn't added any booking services yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
