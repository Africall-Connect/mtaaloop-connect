import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ArrowRight, Clock, Banknote, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VendorProfile } from '@/types/database';
import { DURATION_OPTIONS } from '@/types/booking';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BookingVendorWithServices extends VendorProfile {
  services?: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    category: string | null;
  }[];
}

interface BookingServicesSectionProps {
  vendors: BookingVendorWithServices[];
}

export function BookingServicesSection({ vendors }: BookingServicesSectionProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  if (vendors.length === 0) return null;

  const handleVendorClick = (vendor: BookingVendorWithServices) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a service",
        variant: "destructive",
      });
      navigate("/auth/login", { state: { returnTo: "/home" } });
      return;
    }
    navigate(`/vendor/${vendor.slug}`);
  };

  const handleMyBookingsClick = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to view your bookings",
        variant: "destructive",
      });
      navigate("/auth/login", { state: { returnTo: "/my-bookings" } });
      return;
    }
    navigate('/my-bookings');
  };

  const getDurationLabel = (minutes: number) => {
    return DURATION_OPTIONS.find(d => d.value === minutes)?.label || `${minutes} min`;
  };

  return (
    <section className="mb-8 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <CalendarCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg md:text-2xl font-bold">Book a Service</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Beauty, spa, wellness and more
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {vendors.map((vendor) => (
          <Card
            key={vendor.id}
            className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
            onClick={() => handleVendorClick(vendor)}
          >
            <div className="relative h-24 md:h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              {vendor.logo_url || vendor.cover_image_url ? (
                <img
                  src={vendor.logo_url || vendor.cover_image_url}
                  alt={vendor.business_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary/40" />
                </div>
              )}
              <Badge variant="secondary" className="absolute top-2 right-2 bg-emerald-600 text-white text-xs">
                {vendor.is_open ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm md:text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {vendor.business_name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {vendor.tagline || 'Professional services'}
              </p>
              
              {/* Show first service if available */}
              {vendor.services && vendor.services.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getDurationLabel(vendor.services[0].duration_minutes)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Banknote className="h-3 w-3" />
                    <span>From KES {vendor.services[0].price.toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <CalendarCheck className="h-3 w-3" />
                Book Now
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/beauty-db')}
          className="gap-2"
        >
          View All Services
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleMyBookingsClick}
          className="gap-2"
        >
          <CalendarCheck className="h-4 w-4" />
          My Bookings
        </Button>
      </div>
    </section>
  );
}
