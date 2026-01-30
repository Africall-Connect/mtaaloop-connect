import { BookingTimeSlot } from '@/types/booking';
import { formatTime12h, groupSlotsByPeriod } from '@/lib/bookingUtils';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface BookingTimeSlotGridProps {
  slots: BookingTimeSlot[];
  selectedSlotId?: string;
  onSelectSlot: (slot: BookingTimeSlot) => void;
  loading?: boolean;
}

export function BookingTimeSlotGrid({
  slots,
  selectedSlotId,
  onSelectSlot,
  loading,
}: BookingTimeSlotGridProps) {
  const groupedSlots = groupSlotsByPeriod(slots);

  const renderSection = (title: string, slotsInSection: BookingTimeSlot[], icon: string) => {
    if (slotsInSection.length === 0) return null;

    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h5>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slotsInSection.map(slot => (
            <button
              key={slot.id}
              onClick={() => onSelectSlot(slot)}
              disabled={!slot.is_available || slot.is_blocked}
              className={cn(
                'p-3 rounded-lg text-sm font-medium transition-all min-h-[44px]',
                'border-2',
                selectedSlotId === slot.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : slot.is_available && !slot.is_blocked
                    ? 'border-transparent bg-card hover:border-primary/50 hover:bg-primary/5'
                    : 'border-transparent bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {formatTime12h(slot.slot_start)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading slots...</div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No available time slots for this date</p>
        <p className="text-sm mt-1">Please select another date</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSection('Morning', groupedSlots.morning, '🌅')}
      {renderSection('Afternoon', groupedSlots.afternoon, '☀️')}
      {renderSection('Evening', groupedSlots.evening, '🌙')}
    </div>
  );
}
