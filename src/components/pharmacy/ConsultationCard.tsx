import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConsultationType } from '@/types/consultation';
import { Stethoscope, Clock, Pill } from 'lucide-react';

interface ConsultationCardProps {
  consultation: ConsultationType;
  onSelect: (consultation: ConsultationType) => void;
}

export function ConsultationCard({ consultation, onSelect }: ConsultationCardProps) {
  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/50">
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
      
      <Button 
        className="w-full mt-4" 
        onClick={() => onSelect(consultation)}
      >
        Book Now
      </Button>
    </div>
  );
}
