import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ArrowRight, Clock, Banknote, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VendorProfile } from '@/types/database';
import { DURATION_OPTIONS } from '@/types/booking';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

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
      toast({ title: "Login Required", description: "Please login to book a service", variant: "destructive" });
      navigate("/auth/login", { state: { returnTo: "/home" } });
      return;
    }
    navigate(`/vendor/${vendor.slug}`);
  };

  const handleMyBookingsClick = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to view your bookings", variant: "destructive" });
      navigate("/auth/login", { state: { returnTo: "/my-bookings" } });
      return;
    }
    navigate('/my-bookings');
  };

  const getDurationLabel = (minutes: number) => {
    return DURATION_OPTIONS.find(d => d.value === minutes)?.label || `${minutes} min`;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight text-foreground">Book a Service</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Beauty, spa, wellness and more</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {vendors.map((vendor, i) => (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card
              className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-400 hover:-translate-y-1 h-full"
              onClick={() => handleVendorClick(vendor)}
            >
              <div className="relative h-28 md:h-36 overflow-hidden bg-muted">
                {vendor.logo_url || vendor.cover_image_url ? (
                  <img src={vendor.logo_url || vendor.cover_image_url} alt={vendor.business_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Sparkles className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                <Badge className={`absolute top-2 right-2 text-[10px] border-0 ${
                  vendor.is_open ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"
                }`}>
                  {vendor.is_open ? "Open" : "Closed"}
                </Badge>
              </div>
              <div className="p-3.5">
                <h3 className="font-bold text-sm md:text-base mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
                  {vendor.business_name}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2.5">
                  {vendor.tagline || 'Professional services'}
                </p>
                
                {vendor.services && vendor.services.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getDurationLabel(vendor.services[0].duration_minutes)}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      From KES {vendor.services[0].price.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <Button size="sm" variant="outline"
                  className="w-full text-xs h-8 gap-1.5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Book Now
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/beauty-db')} className="gap-2 rounded-full">
          View All Services <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleMyBookingsClick} className="gap-2 rounded-full">
          <CalendarCheck className="h-4 w-4" /> My Bookings
        </Button>
      </div>
    </section>
  );
}
