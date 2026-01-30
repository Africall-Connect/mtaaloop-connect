// Booking System Utilities - mirrors consultationUtils.ts pattern

import { BookingAvailability, BookingTimeSlot } from '@/types/booking';
import { format, addMinutes, parseISO, isSameDay, getDay, eachDayOfInterval } from 'date-fns';

/**
 * Format time from HH:MM to 12-hour format (e.g., "9:00 AM")
 */
export function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time from HH:MM:SS to HH:MM
 */
export function normalizeTime(time: string): string {
  return time.substring(0, 5);
}

/**
 * Group slots by time period (morning, afternoon, evening)
 */
export function groupSlotsByPeriod(slots: BookingTimeSlot[]): {
  morning: BookingTimeSlot[];
  afternoon: BookingTimeSlot[];
  evening: BookingTimeSlot[];
} {
  const morning: BookingTimeSlot[] = [];
  const afternoon: BookingTimeSlot[] = [];
  const evening: BookingTimeSlot[] = [];

  slots.forEach(slot => {
    const hour = parseInt(slot.slot_start.split(':')[0], 10);
    if (hour < 12) {
      morning.push(slot);
    } else if (hour < 17) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  });

  // Sort each group by time
  const sortByTime = (a: BookingTimeSlot, b: BookingTimeSlot) => 
    a.slot_start.localeCompare(b.slot_start);
  
  return {
    morning: morning.sort(sortByTime),
    afternoon: afternoon.sort(sortByTime),
    evening: evening.sort(sortByTime),
  };
}

/**
 * Generate time slots for a date range based on availability
 */
export function generateSlotsForDateRange(
  startDate: Date,
  endDate: Date,
  availability: BookingAvailability[],
  durationMinutes: number = 60,
  breakMinutes: number = 0
): Omit<BookingTimeSlot, 'id' | 'created_at'>[] {
  const slots: Omit<BookingTimeSlot, 'id' | 'created_at'>[] = [];
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  days.forEach(day => {
    const dayOfWeek = getDay(day);
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability || !dayAvailability.is_available) {
      return;
    }
    
    const dateStr = format(day, 'yyyy-MM-dd');
    const [startHour, startMinute] = dayAvailability.start_time.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end_time.split(':').map(Number);
    
    let currentTime = new Date(day);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(day);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, durationMinutes);
      
      // Don't create slot if it would end after closing time
      if (slotEnd > endTime) break;
      
      slots.push({
        vendor_id: dayAvailability.vendor_id,
        service_type_id: null,
        slot_date: dateStr,
        slot_start: format(currentTime, 'HH:mm'),
        slot_end: format(slotEnd, 'HH:mm'),
        is_available: true,
        is_blocked: false,
      });
      
      // Move to next slot (add duration + break time)
      currentTime = addMinutes(currentTime, durationMinutes + breakMinutes);
    }
  });
  
  return slots;
}

/**
 * Check if a slot conflicts with existing slots
 */
export function hasSlotConflict(
  newSlot: { slot_date: string; slot_start: string; slot_end: string },
  existingSlots: BookingTimeSlot[]
): boolean {
  return existingSlots.some(existing => {
    if (existing.slot_date !== newSlot.slot_date) return false;
    
    const newStart = newSlot.slot_start;
    const newEnd = newSlot.slot_end;
    const existingStart = existing.slot_start;
    const existingEnd = existing.slot_end;
    
    // Check for overlap
    return (newStart < existingEnd && newEnd > existingStart);
  });
}

/**
 * Get available slots for a specific date
 */
export function getAvailableSlotsForDate(
  slots: BookingTimeSlot[],
  date: Date
): BookingTimeSlot[] {
  return slots.filter(slot => 
    isSameDay(parseISO(slot.slot_date), date) &&
    slot.is_available &&
    !slot.is_blocked
  );
}

/**
 * Format slot time range for display
 */
export function formatSlotTimeRange(slot: BookingTimeSlot): string {
  return `${formatTime12h(slot.slot_start)} - ${formatTime12h(slot.slot_end)}`;
}

/**
 * Calculate end time given start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const endDate = addMinutes(date, durationMinutes);
  return format(endDate, 'HH:mm');
}

/**
 * Get dates that have available slots
 */
export function getDatesWithSlots(slots: BookingTimeSlot[]): Date[] {
  const uniqueDates = new Set<string>();
  
  slots.forEach(slot => {
    if (slot.is_available && !slot.is_blocked) {
      uniqueDates.add(slot.slot_date);
    }
  });
  
  return Array.from(uniqueDates).map(dateStr => parseISO(dateStr)).sort((a, b) => a.getTime() - b.getTime());
}
