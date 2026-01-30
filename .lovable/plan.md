
# Pharmacy Consultation System - Complete Design & Implementation Plan

## Overview

This plan creates a **dedicated Pharmacy Consultation system** that separates consultations from the generic booking system. It includes new database tables, vendor management interfaces, and a customer booking flow with pre-consultation health information collection.

---

## Part 1: Database Schema Design

### New Tables to Create

```text
+----------------------------------+
|      consultation_types          |
+----------------------------------+
| id (uuid, PK)                    |
| vendor_id (uuid, FK)             |
| name (text)                      |
| description (text)               |
| duration_minutes (int)           |
| price (numeric)                  |
| is_active (boolean)              |
| requires_prescription (boolean)  |
| created_at (timestamptz)         |
| updated_at (timestamptz)         |
+----------------------------------+
         |
         | 1:N
         v
+----------------------------------+
|   consultation_availability      |
+----------------------------------+
| id (uuid, PK)                    |
| vendor_id (uuid, FK)             |
| day_of_week (int, 0-6)           | -- 0=Sunday, 6=Saturday
| start_time (time)                | -- e.g., '09:00'
| end_time (time)                  | -- e.g., '17:00'
| is_available (boolean)           |
| created_at (timestamptz)         |
+----------------------------------+
         |
         | Referenced by
         v
+----------------------------------+
|     consultation_slots           |
+----------------------------------+
| id (uuid, PK)                    |
| vendor_id (uuid, FK)             |
| consultation_type_id (uuid, FK)  |
| slot_date (date)                 |
| slot_start (time)                |
| slot_end (time)                  |
| is_available (boolean)           | -- Auto-blocked when booked
| is_blocked (boolean)             | -- Manually blocked by vendor
| created_at (timestamptz)         |
+----------------------------------+
         |
         | 1:1
         v
+----------------------------------+
|   consultation_bookings          |
+----------------------------------+
| id (uuid, PK)                    |
| slot_id (uuid, FK)               |
| customer_id (uuid, FK)           |
| vendor_id (uuid, FK)             |
| consultation_type_id (uuid, FK)  |
| status (enum)                    | -- pending, confirmed, completed, cancelled, no_show
| amount (numeric)                 |
| payment_status (enum)            | -- pending, paid, refunded
| customer_notes (text)            |
| pharmacist_notes (text)          |
| booking_date (date)              |
| booking_time (time)              |
| created_at (timestamptz)         |
| updated_at (timestamptz)         |
+----------------------------------+
         |
         | 1:1
         v
+----------------------------------+
|   consultation_pre_info          |
+----------------------------------+
| id (uuid, PK)                    |
| booking_id (uuid, FK)            |
| symptoms (text)                  |
| symptom_duration (text)          |
| has_allergies (boolean)          |
| allergies_details (text)         |
| has_chronic_conditions (boolean) |
| chronic_conditions (text[])      |
| current_medications (text)       |
| is_pregnant (boolean)            |
| is_breastfeeding (boolean)       |
| age_group (enum)                 | -- child, adult, senior
| additional_notes (text)          |
| created_at (timestamptz)         |
+----------------------------------+
```

### Enum Types

```sql
-- Consultation status
CREATE TYPE consultation_status AS ENUM (
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);

-- Payment status
CREATE TYPE consultation_payment_status AS ENUM (
  'pending', 'paid', 'refunded', 'failed'
);

-- Age group for pre-consultation info
CREATE TYPE age_group AS ENUM (
  'infant', 'child', 'teen', 'adult', 'senior'
);
```

### RLS Policies

| Table | Policy | Who |
|-------|--------|-----|
| consultation_types | SELECT, INSERT, UPDATE, DELETE | Vendor (own rows) |
| consultation_availability | SELECT, INSERT, UPDATE, DELETE | Vendor (own rows) |
| consultation_slots | SELECT | Customer (available only), Vendor (all own) |
| consultation_slots | INSERT, UPDATE, DELETE | Vendor (own rows) |
| consultation_bookings | SELECT | Customer (own bookings), Vendor (own pharmacy bookings) |
| consultation_bookings | INSERT | Customer (authenticated) |
| consultation_bookings | UPDATE | Vendor (status updates), Customer (cancel only) |
| consultation_pre_info | SELECT, INSERT | Customer (own), Vendor (for their bookings) |

---

## Part 2: Vendor Dashboard - Consultation Management

### 2.1 New Page: `src/pages/vendor/PharmacyConsultationManagement.tsx`

**Features:**
- **Tab 1: Consultation Types**
  - Create/Edit consultation types (name, description, duration, price)
  - Toggle active/inactive
  - Mark if requires prescription follow-up
  
- **Tab 2: Business Hours & Availability**
  - Weekly schedule grid (Monday-Sunday)
  - Set open/close times for each day (EAT timezone)
  - Mark days as unavailable (e.g., closed on Sundays)
  
- **Tab 3: Time Slots**
  - Calendar view showing slots
  - Auto-generate slots based on business hours + consultation durations
  - Manually block specific slots (vacation, breaks)
  - Color-coded: Available (green), Booked (blue), Blocked (gray)
  
- **Tab 4: Bookings**
  - List of upcoming/past bookings
  - View customer pre-consultation info
  - Update status (confirm, complete, no-show)
  - Add pharmacist notes

### 2.2 Component: `src/components/vendor/consultation/ConsultationTypeForm.tsx`

Form fields:
- Name (e.g., "General Health Consultation", "Medication Review")
- Description
- Duration (dropdown: 15, 30, 45, 60 minutes)
- Price (KSh)
- Requires prescription follow-up (checkbox)
- Is active (toggle)

### 2.3 Component: `src/components/vendor/consultation/AvailabilityScheduler.tsx`

Weekly grid showing:
- Days of week (rows)
- Time slots (columns, 30-min increments)
- Click to toggle availability
- Preset "Copy from Monday" button

### 2.4 Component: `src/components/vendor/consultation/SlotCalendar.tsx`

- Month/Week view toggle
- Shows slots with status badges
- Click slot to see details or block/unblock
- Generate slots button (auto-creates based on availability)

### 2.5 Component: `src/components/vendor/consultation/BookingDetailPanel.tsx`

Slide-in panel showing:
- Customer name & contact
- Booking date/time
- Consultation type
- Pre-consultation health info (symptoms, medications, conditions)
- Status actions (Confirm, Complete, Mark No-Show)
- Pharmacist notes textarea

---

## Part 3: Customer Flow - Booking a Consultation

### 3.1 Update: `src/pages/vendor/views/PharmacyView.tsx`

Replace the current generic booking with a dedicated consultation interface:

**Consultation Tab Changes:**
- List of available consultation types (cards)
- Select consultation type first
- Then show calendar with available slots
- Click slot to proceed to booking form

### 3.2 New Component: `src/components/pharmacy/ConsultationBookingFlow.tsx`

Multi-step flow:

**Step 1: Select Consultation Type**
- Show pharmacy info (name, location, rating)
- Display available consultation types as cards
- Each card shows: name, duration, price

**Step 2: Select Date & Time**
- Calendar (disable past dates)
- Available time slots for selected date
- Auto-filter based on business hours
- Show EAT timezone indicator

**Step 3: Pre-Consultation Info**
- Symptoms description (textarea, required)
- Symptom duration (dropdown: Today, 1-3 days, 1 week, etc.)
- Medical history checkboxes:
  - [ ] I have allergies (show text input if checked)
  - [ ] I have chronic conditions (show multi-select: Diabetes, Hypertension, Asthma, etc.)
  - [ ] I'm currently on medication (show textarea if checked)
  - [ ] I'm pregnant or breastfeeding
- Age group (dropdown)
- Additional notes (optional textarea)

**Step 4: Confirmation**
- Summary card showing:
  - Pharmacy name & location
  - Consultation type, date, time
  - Duration & price
  - Pre-consultation summary
- Agree to terms checkbox
- "Confirm Booking" button

### 3.3 New Component: `src/components/pharmacy/ConsultationCard.tsx`

Display card for a consultation type:
- Icon (Stethoscope)
- Name
- Description (truncated)
- Duration badge
- Price
- "Book Now" button

### 3.4 New Component: `src/components/pharmacy/TimeSlotGrid.tsx`

- Grid of available slots
- Morning (6AM-12PM), Afternoon (12PM-5PM), Evening (5PM-9PM) sections
- Each slot shows time, click to select
- Selected slot highlighted
- Grayed out unavailable slots

### 3.5 New Component: `src/components/pharmacy/PreConsultationForm.tsx`

Form collecting health info:
- Zod validation
- Required: symptoms, symptom_duration, age_group
- Conditional fields based on checkboxes
- Clear visual hierarchy

---

## Part 4: Customer View - My Consultations

### 4.1 New Page: `src/pages/MyConsultations.tsx`

List of customer's consultation bookings:
- Tabs: Upcoming | Past | Cancelled
- Each card shows:
  - Pharmacy name & logo
  - Consultation type
  - Date & time
  - Status badge
  - Actions: Cancel (if pending/confirmed), View Details

### 4.2 Component: `src/components/pharmacy/ConsultationDetailModal.tsx`

Modal showing full booking details:
- Pharmacy info
- Booking info
- Pre-consultation summary (what customer submitted)
- Pharmacist notes (if any, after completion)
- Cancel button (if applicable)

---

## Part 5: Integration Points

### 5.1 Update Vendor Dashboard Navigation

In `src/pages/vendor/NewVendorDashboard.tsx`, change the pharmacy consultation button:

```typescript
// Current (goes to generic bookings)
<Button onClick={() => navigate('/vendor/bookings')}>
  <Stethoscope /> Consultations
</Button>

// New (goes to dedicated consultation management)
<Button onClick={() => navigate('/vendor/consultations')}>
  <Stethoscope /> Consultations
</Button>
```

### 5.2 Add New Routes

In `src/App.tsx`:

```typescript
// Vendor routes
<Route path="/vendor/consultations" element={<PharmacyConsultationManagement />} />

// Customer routes
<Route path="/my-consultations" element={<MyConsultations />} />
```

### 5.3 Update PharmacyView

Replace the generic booking system with the new consultation flow when the vendor is a pharmacy.

### 5.4 Bottom Navigation / Account Menu

Add "My Consultations" link in user account menu.

---

## Part 6: Business Logic

### 6.1 Slot Generation Logic

```typescript
function generateSlots(
  vendorId: string,
  consultationType: ConsultationType,
  availability: ConsultationAvailability[],
  dateRange: { start: Date; end: Date }
): ConsultationSlot[] {
  // For each day in range:
  //   1. Check if day_of_week has availability
  //   2. Get start_time and end_time
  //   3. Generate slots based on consultation duration
  //   4. Skip if slot already exists
  //   5. Return array of slots to insert
}
```

### 6.2 EAT Timezone Handling

- Store times in UTC in database
- Convert to EAT (Africa/Nairobi, UTC+3) in UI
- All time displays show "EAT" indicator

### 6.3 Auto-Block Booked Slots

When a booking is created:
1. Update `consultation_slots.is_available = false`
2. If booking cancelled, revert to `is_available = true`

### 6.4 Booking Status Flow

```text
[pending] -> [confirmed] -> [in_progress] -> [completed]
    |             |
    v             v
[cancelled]   [no_show]
```

---

## Part 7: TypeScript Types

### New Types: `src/types/consultation.ts`

```typescript
export interface ConsultationType {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultationAvailability {
  id: string;
  vendor_id: string;
  day_of_week: number; // 0-6, Sunday = 0
  start_time: string; // HH:MM
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface ConsultationSlot {
  id: string;
  vendor_id: string;
  consultation_type_id: string;
  slot_date: string; // YYYY-MM-DD
  slot_start: string; // HH:MM
  slot_end: string;
  is_available: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface ConsultationBooking {
  id: string;
  slot_id: string;
  customer_id: string;
  vendor_id: string;
  consultation_type_id: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  amount: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  customer_notes: string | null;
  pharmacist_notes: string | null;
  booking_date: string;
  booking_time: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultationPreInfo {
  id: string;
  booking_id: string;
  symptoms: string;
  symptom_duration: string;
  has_allergies: boolean;
  allergies_details: string | null;
  has_chronic_conditions: boolean;
  chronic_conditions: string[] | null;
  current_medications: string | null;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  age_group: 'infant' | 'child' | 'teen' | 'adult' | 'senior';
  additional_notes: string | null;
  created_at: string;
}
```

---

## Part 8: Files Summary

### Database Migration
| File | Description |
|------|-------------|
| `supabase/migrations/[timestamp]_pharmacy_consultation_system.sql` | Creates all tables, enums, RLS policies |

### Vendor Dashboard
| File | Description |
|------|-------------|
| `src/pages/vendor/PharmacyConsultationManagement.tsx` | Main consultation management page |
| `src/components/vendor/consultation/ConsultationTypeForm.tsx` | Create/edit consultation types |
| `src/components/vendor/consultation/AvailabilityScheduler.tsx` | Weekly hours grid |
| `src/components/vendor/consultation/SlotCalendar.tsx` | Calendar with slots |
| `src/components/vendor/consultation/BookingDetailPanel.tsx` | View/manage individual booking |

### Customer Flow
| File | Description |
|------|-------------|
| `src/components/pharmacy/ConsultationBookingFlow.tsx` | Multi-step booking wizard |
| `src/components/pharmacy/ConsultationCard.tsx` | Display consultation type |
| `src/components/pharmacy/TimeSlotGrid.tsx` | Time slot picker |
| `src/components/pharmacy/PreConsultationForm.tsx` | Health info form |
| `src/pages/MyConsultations.tsx` | Customer's consultation history |
| `src/components/pharmacy/ConsultationDetailModal.tsx` | View booking details |

### Types & Utils
| File | Description |
|------|-------------|
| `src/types/consultation.ts` | TypeScript interfaces |
| `src/lib/consultationUtils.ts` | Slot generation, timezone helpers |

### Updates
| File | Description |
|------|-------------|
| `src/App.tsx` | Add new routes |
| `src/pages/vendor/NewVendorDashboard.tsx` | Update consultation button |
| `src/pages/vendor/views/PharmacyView.tsx` | Integrate new booking flow |

---

## Implementation Order

1. **Database First**: Create migration with all tables and RLS
2. **Types**: Add TypeScript interfaces
3. **Vendor Management**: Build consultation type + availability management
4. **Slot System**: Implement slot generation and calendar
5. **Customer Booking Flow**: Multi-step wizard with pre-consultation form
6. **Booking Management**: Vendor view of bookings
7. **My Consultations**: Customer history page
8. **Integration**: Update routes and navigation
9. **Testing**: End-to-end flow verification

---

## Technical Notes

- **Timezone**: All times stored as UTC, displayed as EAT (Africa/Nairobi)
- **Slot Duration**: Derived from consultation type, not hardcoded
- **Availability**: Weekly recurring, not date-specific (simpler for vendors)
- **Blocking**: Vendors can manually block slots (vacation, emergency)
- **Pre-info Privacy**: Only visible to the pharmacy, not stored in cart/order
- **No Cart Integration**: Consultations bypass cart, direct booking flow
