import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookingServiceType, DURATION_OPTIONS } from '@/types/booking';
import { Clock, Banknote, ChevronRight, CalendarCheck } from 'lucide-react';

interface BookingServiceCardProps {
  service: BookingServiceType;
  onBook: () => void;
}

export function BookingServiceCard({ service, onBook }: BookingServiceCardProps) {
  const durationLabel = DURATION_OPTIONS.find(d => d.value === service.duration_minutes)?.label || `${service.duration_minutes} min`;

  return (
    <Card className="p-4 hover:border-primary/30 hover:shadow-md transition-all group">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {service.name}
          </h4>
          {service.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {service.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{durationLabel}</span>
            </div>
            {service.category && (
              <div className="text-xs bg-muted px-2 py-0.5 rounded">
                {service.category}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1 font-bold text-lg">
            <Banknote className="h-5 w-5 text-primary" />
            <span>KES {service.price.toLocaleString()}</span>
          </div>
          
          <Button 
            size="sm" 
            onClick={onBook}
            className="gap-1 min-h-[44px]"
          >
            <CalendarCheck className="h-4 w-4" />
            Book Now
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
