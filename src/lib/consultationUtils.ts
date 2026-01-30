// Consultation Utilities - Timezone handling and slot generation

import { ConsultationAvailability, ConsultationSlot, ConsultationType, DAY_NAMES } from '@/types/consultation';
import { format, addMinutes, parse, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

// EAT timezone offset (+3 hours from UTC)
const EAT_OFFSET_HOURS = 3;

/**
 * Convert UTC time to EAT (East Africa Time)
 */
export function utcToEAT(date: Date): Date {
  return new Date(date.getTime() + EAT_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Convert EAT time to UTC for storage
 */
export function eatToUTC(date: Date): Date {
  return new Date(date.getTime() - EAT_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Format time string to 12-hour format
 */
export function formatTime12h(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time string to 24-hour format
 */
export function formatTime24h(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return formatTime24h(hours, mins);
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek];
}

/**
 * Generate time slots for a specific date based on availability and consultation duration
 */
export function generateSlotsForDate(
  date: Date,
  availability: ConsultationAvailability | undefined,
  consultationType: ConsultationType,
  existingSlots: ConsultationSlot[] = []
): { start: string; end: string }[] {
  if (!availability || !availability.is_available) {
    return [];
  }

  const slots: { start: string; end: string }[] = [];
  const duration = consultationType.duration_minutes;
  
  const startMinutes = timeToMinutes(availability.start_time);
  const endMinutes = timeToMinutes(availability.end_time);
  
  // Generate slots in increments of duration
  let currentMinutes = startMinutes;
  
  while (currentMinutes + duration <= endMinutes) {
    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(currentMinutes + duration);
    
    // Check if slot already exists
    const slotExists = existingSlots.some(
      s => s.slot_start === slotStart && format(new Date(s.slot_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (!slotExists) {
      slots.push({ start: slotStart, end: slotEnd });
    }
    
    currentMinutes += duration;
  }
  
  return slots;
}

/**
 * Generate slots for a date range
 */
export function generateSlotsForDateRange(
  startDate: Date,
  endDate: Date,
  availability: ConsultationAvailability[],
  consultationType: ConsultationType,
  existingSlots: ConsultationSlot[] = []
): { date: Date; slots: { start: string; end: string }[] }[] {
  const result: { date: Date; slots: { start: string; end: string }[] }[] = [];
  
  let currentDate = startOfDay(startDate);
  const end = startOfDay(endDate);
  
  while (!isAfter(currentDate, end)) {
    const dayOfWeek = currentDate.getDay();
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    
    const slots = generateSlotsForDate(currentDate, dayAvailability, consultationType, existingSlots);
    
    if (slots.length > 0) {
      result.push({ date: currentDate, slots });
    }
    
    currentDate = addDays(currentDate, 1);
  }
  
  return result;
}

/**
 * Group slots by time period (Morning, Afternoon, Evening)
 */
export function groupSlotsByPeriod(slots: ConsultationSlot[]): {
  morning: ConsultationSlot[];
  afternoon: ConsultationSlot[];
  evening: ConsultationSlot[];
} {
  return {
    morning: slots.filter(s => {
      const hour = parseInt(s.slot_start.split(':')[0]);
      return hour >= 6 && hour < 12;
    }),
    afternoon: slots.filter(s => {
      const hour = parseInt(s.slot_start.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    evening: slots.filter(s => {
      const hour = parseInt(s.slot_start.split(':')[0]);
      return hour >= 17 && hour < 21;
    }),
  };
}

/**
 * Check if a slot is in the past
 */
export function isSlotInPast(slot: ConsultationSlot): boolean {
  const now = new Date();
  const slotDateTime = new Date(`${slot.slot_date}T${slot.slot_start}`);
  return isBefore(slotDateTime, now);
}

/**
 * Format booking date and time for display
 */
export function formatBookingDateTime(date: string, time: string): string {
  const dateObj = new Date(date);
  const formattedDate = format(dateObj, 'EEE, MMM d, yyyy');
  const formattedTime = formatTime12h(time);
  return `${formattedDate} at ${formattedTime} EAT`;
}

/**
 * Get default business hours
 */
export function getDefaultAvailability(vendorId: string): Omit<ConsultationAvailability, 'id' | 'created_at'>[] {
  // Monday to Friday, 9 AM to 5 PM
  return [1, 2, 3, 4, 5].map(day => ({
    vendor_id: vendorId,
    day_of_week: day,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
  }));
}
