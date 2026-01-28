import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

const TimeSlotPicker = ({ onSelect }: { onSelect: (slot: TimeSlot) => void }) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  });

  // Generate time slots (9 AM to 9 PM, every 30 min)
  const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    return {
      value: time,
      label: new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  });

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onSelect({
        date: selectedDate,
        time: selectedTime,
        available: true
      });
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <Label className="text-base font-semibold">📅 Schedule Delivery</Label>

      <div className="space-y-3">
        <div>
          <Label htmlFor="date-select" className="text-sm">Select Date</Label>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger id="date-select">
              <SelectValue placeholder="Choose delivery date" />
            </SelectTrigger>
            <SelectContent>
              {dates.map((date) => (
                <SelectItem key={date.value} value={date.value}>
                  {date.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="time-select" className="text-sm">Select Time</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger id="time-select">
              <SelectValue placeholder="Choose delivery time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium">
            📅 Scheduled for: {new Date(selectedDate).toLocaleDateString()} at{' '}
            {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime}
        className="w-full"
      >
        Confirm Time Slot
      </Button>
    </Card>
  );
};

export default TimeSlotPicker;
