import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConsultationSlot, ConsultationType } from '@/types/consultation';
import { formatTime12h, groupSlotsByPeriod } from '@/lib/consultationUtils';
import { format, isSameDay } from 'date-fns';
import { CalendarClock, Lock, Unlock, RefreshCw, Loader2 } from 'lucide-react';

interface SlotCalendarProps {
  slots: ConsultationSlot[];
  consultationTypes: ConsultationType[];
  onGenerateSlots: (startDate: Date, endDate: Date) => Promise<void>;
  onToggleSlotBlock: (slotId: string, blocked: boolean) => Promise<void>;
  loading?: boolean;
}

export function SlotCalendar({
  slots,
  consultationTypes,
  onGenerateSlots,
  onToggleSlotBlock,
  loading,
}: SlotCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [generating, setGenerating] = useState(false);

  const slotsForDate = slots.filter(s => 
    isSameDay(new Date(s.slot_date), selectedDate)
  );

  const groupedSlots = groupSlotsByPeriod(slotsForDate);

  const handleGenerateWeek = async () => {
    setGenerating(true);
    try {
      const start = selectedDate;
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 7);
      await onGenerateSlots(start, end);
    } finally {
      setGenerating(false);
    }
  };

  const getSlotColor = (slot: ConsultationSlot) => {
    if (slot.is_blocked) return 'bg-muted text-muted-foreground';
    if (!slot.is_available) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800';
  };

  const getDateHighlight = (date: Date) => {
    const daySlots = slots.filter(s => isSameDay(new Date(s.slot_date), date));
    if (daySlots.length === 0) return '';
    
    const hasBooked = daySlots.some(s => !s.is_available && !s.is_blocked);
    const hasAvailable = daySlots.some(s => s.is_available && !s.is_blocked);
    
    if (hasBooked && hasAvailable) return 'bg-purple-100 dark:bg-purple-900/30';
    if (hasBooked) return 'bg-blue-100 dark:bg-blue-900/30';
    if (hasAvailable) return 'bg-green-100 dark:bg-green-900/30';
    return 'bg-muted';
  };

  const renderSlotSection = (title: string, slotsInSection: ConsultationSlot[]) => {
    if (slotsInSection.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-muted-foreground">{title}</h5>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slotsInSection.map(slot => (
            <button
              key={slot.id}
              onClick={() => onToggleSlotBlock(slot.id, !slot.is_blocked)}
              disabled={!slot.is_available && !slot.is_blocked}
              className={cn(
                'p-2 rounded-lg text-xs font-medium transition-colors',
                getSlotColor(slot),
                (!slot.is_available && !slot.is_blocked) && 'cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span>{formatTime12h(slot.slot_start)}</span>
                {slot.is_blocked && <Lock className="h-3 w-3" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Time Slots</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateWeek}
          disabled={generating || consultationTypes.length === 0}
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Generate Week
        </Button>
      </div>

      {consultationTypes.length === 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
          Create at least one consultation type before generating slots.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-card rounded-lg border p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md pointer-events-auto"
            modifiers={{
              hasSlots: (date) => slots.some(s => isSameDay(new Date(s.slot_date), date)),
            }}
            modifiersClassNames={{
              hasSlots: getDateHighlight(selectedDate),
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>Blocked</span>
            </div>
          </div>
        </div>

        {/* Slots for selected date */}
        <div className="bg-card rounded-lg border p-4">
          <h4 className="font-medium mb-4">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h4>
          
          {slotsForDate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No slots for this date</p>
              <p className="text-xs mt-1">Generate slots or select another date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderSlotSection('Morning', groupedSlots.morning)}
              {renderSlotSection('Afternoon', groupedSlots.afternoon)}
              {renderSlotSection('Evening', groupedSlots.evening)}
              
              <p className="text-xs text-muted-foreground pt-2">
                Click an available slot to block/unblock it
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
