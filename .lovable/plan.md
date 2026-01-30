
# Booking System Enhancement Plan

## Overview

This plan enhances the booking operational_category to mirror the pharmacy consultation system, providing a complete booking management experience for vendors (spas, salons, accommodation, etc.) and a polished customer booking flow.

---

## Current State Analysis

### Vendor Side (VendorBookingManagement.tsx)
- Basic form with name, category, subcategory, description, price, toggles
- Manual slot creation using datetime-local inputs (one at a time)
- Uses `booking_slots` table linked to products
- No recurring availability management
- No auto-generation of slots

### Customer Side (BookingView.tsx)
- Basic calendar + list of slots
- No date filtering (shows all slots)
- No service type selection flow
- No customer notes field
- Plain design, lacks polish

### Reference: Pharmacy Consultation System
- 4-tab management: Types, Hours, Slots, Bookings
- Weekly availability scheduler with day toggles
- Auto-generate slots for date ranges
- Slot blocking/unblocking
- Multi-step customer booking flow with pre-info collection
- Themed UI with progress indicators

---

## Database Schema Changes

### New Tables Required

**1. `booking_service_types`** - Similar to `consultation_types`
```sql
CREATE TABLE booking_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC NOT NULL,
  category TEXT,
  subcategory TEXT,
  requires_address BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**2. `booking_availability`** - Weekly recurring hours
```sql
CREATE TABLE booking_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, day_of_week)
);
```

**3. `booking_time_slots`** - Generated specific time slots (replaces/enhances existing `booking_slots`)
```sql
CREATE TABLE booking_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES booking_service_types(id) ON DELETE SET NULL,
  slot_date DATE NOT NULL,
  slot_start TIME NOT NULL,
  slot_end TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**4. `booking_reservations`** - Customer bookings
```sql
CREATE TABLE booking_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES booking_time_slots(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES booking_service_types(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  customer_notes TEXT,
  vendor_notes TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Vendor Side Implementation

### New File Structure

```text
src/
├── types/
│   └── booking.ts              # New booking types (mirror consultation.ts pattern)
├── lib/
│   └── bookingUtils.ts         # Slot generation utilities
├── components/
│   └── vendor/
│       └── booking/
│           ├── BookingServiceForm.tsx    # Add/edit service types
│           ├── BookingAvailabilityScheduler.tsx
│           ├── BookingSlotCalendar.tsx
│           └── BookingReservationPanel.tsx
└── pages/
    └── vendor/
        └── VendorBookingManagement.tsx   # Refactored with tabs
```

### VendorBookingManagement.tsx Redesign

Refactor to use 4 tabs similar to PharmacyConsultationManagement:

```text
+----------------------------------------------------------+
|  [Back]  Booking Management                               |
|          Manage services, availability, and bookings      |
+----------------------------------------------------------+
|  [Services] [Hours] [Slots] [Bookings (3)]               |
+----------------------------------------------------------+
|                                                          |
|  TAB CONTENT AREA                                        |
|                                                          |
+----------------------------------------------------------+
```

**Tab 1: Services**
- List of booking service types with cards
- Add/Edit dialog with form fields:
  - Name (required)
  - Description
  - Duration (slider: 15/30/45/60/90/120 minutes)
  - Price
  - Category/Subcategory (from vendor_categories)
  - Requires on-site location toggle
  - Active toggle

**Tab 2: Hours (Availability)**
- Weekly schedule with day toggles (Sun-Sat)
- Start/End time selectors for each day
- "Copy Monday to Weekdays" quick action
- Save button

**Tab 3: Slots**
- Calendar view showing dates with slots
- "Generate Week" button to auto-create slots
- Click date to see day's slots
- Click slot to block/unblock
- Color-coded: green (available), blue (booked), gray (blocked)

**Tab 4: Bookings**
- List of customer reservations
- Status badges (pending, confirmed, completed, etc.)
- Click to open detail panel
- Update status, add vendor notes

---

### types/booking.ts (New)

```typescript
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type BookingPaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface BookingServiceType {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  subcategory: string | null;
  requires_address: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingAvailability {
  id: string;
  vendor_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:MM
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface BookingTimeSlot {
  id: string;
  vendor_id: string;
  service_type_id: string | null;
  slot_date: string; // YYYY-MM-DD
  slot_start: string; // HH:MM
  slot_end: string;
  is_available: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface BookingReservation {
  id: string;
  slot_id: string | null;
  customer_id: string;
  vendor_id: string;
  service_type_id: string;
  status: BookingStatus;
  amount: number;
  payment_status: BookingPaymentStatus;
  customer_notes: string | null;
  vendor_notes: string | null;
  booking_date: string;
  booking_time: string;
  created_at: string;
  updated_at: string;
  // Joined
  service_type?: BookingServiceType;
  vendor?: { id: string; business_name: string; logo_url: string | null; business_address: string };
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const BOOKING_STATUS_LABELS: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  no_show: { label: 'No Show', color: 'bg-red-100 text-red-800' },
};
```

---

## Customer Side Implementation

### New Component: BookingFlow.tsx

Multi-step wizard similar to ConsultationBookingFlow:

```text
Step 1: Select Service
+----------------------------------------------------------+
|  [Back]  Book a Service                                   |
|          Vendor Name • Address • Rating                   |
+----------------------------------------------------------+
|  ① ─── ② ─── ③ ─── ④                                    |
+----------------------------------------------------------+
|  Select a Service                                         |
|                                                          |
|  +------------------------------------------------+      |
|  | Spa Massage                                    |      |
|  | Full body relaxation massage                   |      |
|  | 60 min • KES 2,500                   [Select] |      |
|  +------------------------------------------------+      |
+----------------------------------------------------------+

Step 2: Select Date & Time
+----------------------------------------------------------+
|  [Calendar]          |  Tuesday, January 30              |
|                      |                                   |
|                      |  Morning (6 AM - 12 PM)           |
|                      |  [9:00 AM] [9:30 AM] [10:00 AM]   |
|                      |                                   |
|                      |  Afternoon (12 PM - 5 PM)         |
|                      |  [1:00 PM] [2:00 PM] [3:00 PM]    |
+----------------------------------------------------------+
|  [Continue]                                              |
+----------------------------------------------------------+

Step 3: Add Notes
+----------------------------------------------------------+
|  Add Notes for the Vendor                                |
|                                                          |
|  [Textarea: Any special requests or information...]      |
|                                                          |
|  Examples:                                               |
|  • Specific preferences (e.g., pressure level)           |
|  • Allergies or sensitivities                            |
|  • Special occasions                                     |
|                                                          |
|  [Continue]                                              |
+----------------------------------------------------------+

Step 4: Confirm Booking
+----------------------------------------------------------+
|  Confirm Your Booking                                     |
|                                                          |
|  [Service Icon]  Spa Massage                             |
|                  Vendor Name                              |
|                                          KES 2,500       |
|  ─────────────────────────────────────────────────       |
|  📅 Tuesday, January 30, 2024                            |
|  🕐 9:00 AM - 10:00 AM EAT                               |
|  📍 123 Business Address                                 |
|  ─────────────────────────────────────────────────       |
|  Notes: Light pressure preferred                         |
|  ─────────────────────────────────────────────────       |
|                                                          |
|  [ ] I confirm and agree to booking terms               |
|                                                          |
|  [Confirm Booking]                                       |
+----------------------------------------------------------+
```

### Enhanced BookingView.tsx

Redesign the customer-facing booking view:

```typescript
export function BookingView({ vendor, products }: BookingViewProps) {
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<BookingServiceType[]>([]);
  
  // Fetch service types from booking_service_types
  useEffect(() => {
    fetchServiceTypes(vendor.id);
  }, [vendor.id]);
  
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Book a Session</h2>
            <p className="text-muted-foreground">Choose a service and pick your preferred time</p>
          </div>
        </div>
      </div>
      
      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceTypes.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onBook={() => { setSelectedService(service); setShowBookingFlow(true); }}
          />
        ))}
      </div>
      
      {/* Booking Flow Modal */}
      <Dialog open={showBookingFlow} onOpenChange={setShowBookingFlow}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BookingFlow
            vendor={vendor}
            initialService={selectedService}
            onClose={() => setShowBookingFlow(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `supabase/migrations/XXXXX_booking_system_schema.sql` | New tables for booking system |
| Create | `src/types/booking.ts` | TypeScript types for booking system |
| Create | `src/lib/bookingUtils.ts` | Slot generation utilities |
| Create | `src/components/vendor/booking/BookingServiceForm.tsx` | Service type form |
| Create | `src/components/vendor/booking/BookingAvailabilityScheduler.tsx` | Weekly hours manager |
| Create | `src/components/vendor/booking/BookingSlotCalendar.tsx` | Slot calendar with generation |
| Create | `src/components/vendor/booking/BookingReservationPanel.tsx` | Booking detail panel |
| Create | `src/components/booking/BookingFlow.tsx` | Customer booking wizard |
| Create | `src/components/booking/BookingServiceCard.tsx` | Service card for customers |
| Create | `src/components/booking/BookingTimeSlotGrid.tsx` | Time slot picker |
| Modify | `src/pages/vendor/VendorBookingManagement.tsx` | Refactor with 4-tab structure |
| Modify | `src/pages/vendor/views/BookingView.tsx` | Use new booking components |

---

## Implementation Order

1. **Database Migration** - Create new tables with RLS policies
2. **Types & Utils** - Create booking.ts and bookingUtils.ts
3. **Vendor Components** - Build the 4 tab components
4. **VendorBookingManagement.tsx** - Refactor with new tab structure
5. **Customer Components** - Build BookingFlow wizard
6. **BookingView.tsx** - Integrate new customer experience

---

## Theme & Styling

### Vendor Side
- Background: `bg-background` (dark mode compatible)
- Cards: `bg-card border rounded-lg`
- Active tabs: Primary color
- Status badges with semantic colors

### Customer Side
- Gradient headers: `bg-gradient-to-r from-primary/10 via-primary/5`
- Service cards with hover animations
- Progress steps with primary color indicators
- Time slots with clear selection states

---

## Mobile Responsiveness

- 44px minimum touch targets for all buttons
- Single column layouts on mobile
- Horizontal scroll for time slot grids when needed
- Collapsible calendar on mobile
- Full-width buttons in booking flow

---

## Summary

| Before | After |
|--------|-------|
| Manual slot creation (datetime-local) | Auto-generated slots from weekly schedule |
| Single form dialog | 4-tab management interface |
| Basic booking list | Rich detail panel with status updates |
| Plain customer view | Multi-step booking wizard |
| No customer notes | Customer notes field in booking flow |
| One-by-one slot management | Bulk slot generation + blocking |
