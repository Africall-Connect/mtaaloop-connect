import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookingAvailability, DAY_NAMES } from '@/types/booking';
import { Clock, Copy, Save, Loader2 } from 'lucide-react';

interface BookingAvailabilitySchedulerProps {
  availability: BookingAvailability[];
  onSave: (availability: Partial<BookingAvailability>[]) => Promise<void>;
  loading?: boolean;
}

// Generate time options in 30-minute increments from 6 AM to 10 PM
const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 30) {
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    const label = `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
    TIME_OPTIONS.push({ value: timeStr, label });
  }
}

export function BookingAvailabilityScheduler({ 
  availability, 
  onSave, 
  loading 
}: BookingAvailabilitySchedulerProps) {
  const [schedule, setSchedule] = useState<Record<number, { start: string; end: string; isAvailable: boolean }>>(() => {
    const initial: Record<number, { start: string; end: string; isAvailable: boolean }> = {};
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      const existing = availability.find(a => a.day_of_week === i);
      initial[i] = {
        start: existing?.start_time?.substring(0, 5) || '09:00',
        end: existing?.end_time?.substring(0, 5) || '17:00',
        isAvailable: existing?.is_available ?? (i >= 1 && i <= 5), // Mon-Fri default
      };
    }
    
    return initial;
  });

  const handleToggleDay = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], isAvailable: !prev[day].isAvailable },
    }));
  };

  const handleTimeChange = (day: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const copyFromMonday = () => {
    const mondaySchedule = schedule[1];
    const newSchedule = { ...schedule };
    
    for (let i = 2; i <= 5; i++) { // Tue-Fri
      newSchedule[i] = { ...mondaySchedule };
    }
    
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    const data: Partial<BookingAvailability>[] = Object.entries(schedule).map(([day, config]) => ({
      day_of_week: parseInt(day),
      start_time: config.start,
      end_time: config.end,
      is_available: config.isAvailable,
    }));
    
    await onSave(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Business Hours (EAT)</h3>
        </div>
        <Button variant="outline" size="sm" onClick={copyFromMonday} className="gap-2">
          <Copy className="h-4 w-4" />
          Copy Monday to Weekdays
        </Button>
      </div>

      <div className="space-y-3">
        {DAY_NAMES.map((dayName, index) => (
          <div
            key={index}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
              schedule[index].isAvailable ? 'bg-card' : 'bg-muted/50'
            }`}
          >
            <div className="w-24 shrink-0">
              <Label className="font-medium">{dayName}</Label>
            </div>
            
            <Switch
              checked={schedule[index].isAvailable}
              onCheckedChange={() => handleToggleDay(index)}
            />
            
            {schedule[index].isAvailable ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={schedule[index].start}
                  onValueChange={(value) => handleTimeChange(index, 'start', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <span className="text-muted-foreground">to</span>
                
                <Select
                  value={schedule[index].end}
                  onValueChange={(value) => handleTimeChange(index, 'end', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span className="text-muted-foreground italic">Closed</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Availability
        </Button>
      </div>
    </div>
  );
}
