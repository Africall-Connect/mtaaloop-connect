import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingServiceCard } from '@/components/booking/BookingServiceCard';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { BookingServiceType } from '@/types/booking';
import { VendorWithProducts, Product } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { CalendarCheck, Star, Clock, MapPin } from 'lucide-react';

interface BookingViewProps {
  vendor: VendorWithProducts;
  products: Product[];
}

export function BookingView({ vendor, products }: BookingViewProps) {
  const [serviceTypes, setServiceTypes] = useState<BookingServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedService, setSelectedService] = useState<BookingServiceType | null>(null);

  const fetchServiceTypes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('booking_service_types')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching service types:', error);
    } else {
      setServiceTypes((data as BookingServiceType[]) || []);
    }
    setLoading(false);
  }, [vendor.id]);

  useEffect(() => {
    fetchServiceTypes();
  }, [fetchServiceTypes]);

  const handleBookService = (service: BookingServiceType) => {
    setSelectedService(service);
    setShowBookingFlow(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingFlow(false);
    setSelectedService(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-full shrink-0">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Book a Session</h2>
            <p className="text-muted-foreground mb-4">
              Choose a service and pick your preferred time
            </p>
            
            {/* Vendor Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {vendor.rating && vendor.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                  {vendor.review_count && (
                    <span className="text-muted-foreground">({vendor.review_count} reviews)</span>
                  )}
                </div>
              )}
              {vendor.delivery_time && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{vendor.delivery_time}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{vendor.business_address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {serviceTypes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Booking Services Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            This vendor hasn't added any booking services yet. Check back soon!
          </p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceTypes.map(service => (
                <BookingServiceCard
                  key={service.id}
                  service={service}
                  onBook={() => handleBookService(service)}
                />
              ))}
            </div>
          </div>

          {/* Quick Book CTA for mobile */}
          <div className="md:hidden fixed bottom-20 left-4 right-4 z-10">
            <Button
              size="lg"
              className="w-full shadow-lg"
              onClick={() => setShowBookingFlow(true)}
            >
              <CalendarCheck className="h-5 w-5 mr-2" />
              Book Now
            </Button>
          </div>
        </>
      )}

      {/* Booking Flow Dialog */}
      <Dialog open={showBookingFlow} onOpenChange={setShowBookingFlow}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <div className="p-6 h-full max-h-[90vh] overflow-y-auto">
            <BookingFlow
              vendor={vendor}
              initialService={selectedService}
              onClose={() => setShowBookingFlow(false)}
              onSuccess={handleBookingSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
