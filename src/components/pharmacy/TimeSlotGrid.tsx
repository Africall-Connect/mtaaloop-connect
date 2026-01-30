import { cn } from '@/lib/utils';
import { ConsultationSlot } from '@/types/consultation';
import { formatTime12h, groupSlotsByPeriod } from '@/lib/consultationUtils';
import { Clock, Sun, Sunset, Moon } from 'lucide-react';

interface TimeSlotGridProps {
  slots: ConsultationSlot[];
  selectedSlot: ConsultationSlot | null;
  onSelectSlot: (slot: ConsultationSlot) => void;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelectSlot }: TimeSlotGridProps) {
  const grouped = groupSlotsByPeriod(slots);
  
  const availableSlots = slots.filter(s => s.is_available && !s.is_blocked);
  
  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No available slots</p>
        <p className="text-sm mt-1">Please select a different date</p>
      </div>
    );
  }

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    sectionSlots: ConsultationSlot[]
  ) => {
    const available = sectionSlots.filter(s => s.is_available && !s.is_blocked);
    
    if (available.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {available.map(slot => (
            <button
              key={slot.id}
              onClick={() => onSelectSlot(slot)}
              className={cn(
                'p-3 rounded-lg text-sm font-medium transition-all border-2',
                selectedSlot?.id === slot.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
              )}
            >
              {formatTime12h(slot.slot_start)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSection(
        'Morning (6 AM - 12 PM)',
        <Sun className="h-4 w-4" />,
        grouped.morning
      )}
      {renderSection(
        'Afternoon (12 PM - 5 PM)',
        <Sunset className="h-4 w-4" />,
        grouped.afternoon
      )}
      {renderSection(
        'Evening (5 PM - 9 PM)',
        <Moon className="h-4 w-4" />,
        grouped.evening
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        All times are in EAT (East Africa Time)
      </p>
    </div>
  );
}
