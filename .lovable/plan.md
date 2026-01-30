

# Database Migration: Pharmacy Consultation System

## Overview

This migration creates a complete database schema for the Pharmacy Consultation system with 5 new tables, proper RLS policies, helper functions, and auto-sync triggers. The tables are designed to integrate with the existing `vendor_profiles` table using `vendor_id` references.

---

## Tables to Create

### 1. consultation_types
Stores the types of consultations each pharmacy offers.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Primary key |
| vendor_id | uuid (FK) | References vendor_profiles.id |
| name | text | e.g., "General Health Consultation" |
| description | text | Optional description |
| duration_minutes | integer | 15, 30, 45, or 60 |
| price | numeric(10,2) | Price in KSh |
| is_active | boolean | Default true |
| requires_prescription | boolean | Default false |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated |

### 2. consultation_availability
Stores weekly recurring business hours for each pharmacy.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Primary key |
| vendor_id | uuid (FK) | References vendor_profiles.id |
| day_of_week | integer | 0=Sunday to 6=Saturday |
| start_time | time | e.g., '09:00' |
| end_time | time | e.g., '17:00' |
| is_available | boolean | Default true |
| created_at | timestamptz | Auto-set |

### 3. consultation_slots
Stores individual bookable time slots generated from availability.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Primary key |
| vendor_id | uuid (FK) | References vendor_profiles.id |
| consultation_type_id | uuid (FK) | References consultation_types.id (nullable) |
| slot_date | date | The date of the slot |
| slot_start | time | Start time |
| slot_end | time | End time |
| is_available | boolean | Auto-blocked when booked |
| is_blocked | boolean | Manually blocked by vendor |
| created_at | timestamptz | Auto-set |

### 4. consultation_bookings
Stores customer consultation bookings.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Primary key |
| slot_id | uuid (FK) | References consultation_slots.id (nullable) |
| customer_id | uuid (FK) | References auth.users.id (NOT NULL) |
| vendor_id | uuid (FK) | References vendor_profiles.id |
| consultation_type_id | uuid (FK) | References consultation_types.id |
| status | text | pending, confirmed, in_progress, completed, cancelled, no_show |
| amount | numeric(10,2) | Price paid |
| payment_status | text | pending, paid, refunded, failed |
| customer_notes | text | Optional notes from customer |
| pharmacist_notes | text | Notes from pharmacist |
| booking_date | date | The scheduled date |
| booking_time | time | The scheduled time |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated |

### 5. consultation_pre_info
Stores pre-consultation health information (sensitive medical data).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Primary key |
| booking_id | uuid (FK) | References consultation_bookings.id (UNIQUE) |
| symptoms | text | Patient's symptoms |
| symptom_duration | text | How long symptoms have lasted |
| has_allergies | boolean | Default false |
| allergies_details | text | Optional allergy details |
| has_chronic_conditions | boolean | Default false |
| chronic_conditions | text[] | Array of conditions |
| current_medications | text | Current medications |
| is_pregnant | boolean | Default false |
| is_breastfeeding | boolean | Default false |
| age_group | text | infant, child, teen, adult, senior |
| additional_notes | text | Optional extra info |
| created_at | timestamptz | Auto-set |

---

## Security Definer Helper Functions

To avoid RLS recursion when checking vendor ownership, we create helper functions:

### is_consultation_vendor()
```sql
CREATE OR REPLACE FUNCTION public.is_consultation_vendor(_user_id uuid, _vendor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vendor_profiles
    WHERE id = _vendor_id
      AND user_id = _user_id
  )
$$;
```

### get_customer_vendor_id()
```sql
CREATE OR REPLACE FUNCTION public.get_customer_vendor_id(_booking_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_id
  FROM public.consultation_bookings
  WHERE id = _booking_id
$$;
```

---

## RLS Policies

### consultation_types

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT (public) | "Anyone can view active consultation types" | is_active = true |
| SELECT (vendor) | "Vendors view own consultation types" | is_consultation_vendor(auth.uid(), vendor_id) |
| INSERT | "Vendors create consultation types" | is_consultation_vendor(auth.uid(), vendor_id) |
| UPDATE | "Vendors update own consultation types" | is_consultation_vendor(auth.uid(), vendor_id) |
| DELETE | "Vendors delete own consultation types" | is_consultation_vendor(auth.uid(), vendor_id) |

### consultation_availability

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | "Vendors view own availability" | is_consultation_vendor(auth.uid(), vendor_id) |
| INSERT | "Vendors create availability" | is_consultation_vendor(auth.uid(), vendor_id) |
| UPDATE | "Vendors update availability" | is_consultation_vendor(auth.uid(), vendor_id) |
| DELETE | "Vendors delete availability" | is_consultation_vendor(auth.uid(), vendor_id) |

### consultation_slots

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT (public) | "Anyone can view available slots" | is_available = true AND is_blocked = false |
| SELECT (vendor) | "Vendors view all own slots" | is_consultation_vendor(auth.uid(), vendor_id) |
| INSERT | "Vendors create slots" | is_consultation_vendor(auth.uid(), vendor_id) |
| UPDATE | "Vendors update slots" | is_consultation_vendor(auth.uid(), vendor_id) |
| DELETE | "Vendors delete slots" | is_consultation_vendor(auth.uid(), vendor_id) |

### consultation_bookings

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT (customer) | "Customers view own bookings" | customer_id = auth.uid() |
| SELECT (vendor) | "Vendors view pharmacy bookings" | is_consultation_vendor(auth.uid(), vendor_id) |
| INSERT | "Authenticated users create bookings" | customer_id = auth.uid() |
| UPDATE (customer) | "Customers can cancel own bookings" | customer_id = auth.uid() AND status IN ('pending', 'confirmed') |
| UPDATE (vendor) | "Vendors update booking status" | is_consultation_vendor(auth.uid(), vendor_id) |

### consultation_pre_info

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT (customer) | "Customers view own pre-info" | EXISTS (SELECT 1 FROM consultation_bookings WHERE id = booking_id AND customer_id = auth.uid()) |
| SELECT (vendor) | "Vendors view pre-info for their bookings" | is_consultation_vendor(auth.uid(), get_customer_vendor_id(booking_id)) |
| INSERT | "Customers create pre-info" | EXISTS (SELECT 1 FROM consultation_bookings WHERE id = booking_id AND customer_id = auth.uid()) |

---

## Triggers

### Auto-update updated_at
```sql
CREATE TRIGGER update_consultation_types_updated_at
  BEFORE UPDATE ON consultation_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_bookings_updated_at
  BEFORE UPDATE ON consultation_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-block slot when booked
```sql
CREATE OR REPLACE FUNCTION auto_block_slot_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking is created, mark the slot as unavailable
  IF TG_OP = 'INSERT' AND NEW.slot_id IS NOT NULL THEN
    UPDATE consultation_slots
    SET is_available = false
    WHERE id = NEW.slot_id;
  END IF;
  
  -- When a booking is cancelled, make the slot available again
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE consultation_slots
    SET is_available = true
    WHERE id = NEW.slot_id AND is_blocked = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_block_slot_on_booking
  AFTER INSERT OR UPDATE ON consultation_bookings
  FOR EACH ROW EXECUTE FUNCTION auto_block_slot_on_booking();
```

---

## Indexes

```sql
-- consultation_types
CREATE INDEX idx_consultation_types_vendor_id ON consultation_types(vendor_id);
CREATE INDEX idx_consultation_types_is_active ON consultation_types(is_active);

-- consultation_availability
CREATE INDEX idx_consultation_availability_vendor_id ON consultation_availability(vendor_id);
CREATE INDEX idx_consultation_availability_day_of_week ON consultation_availability(day_of_week);

-- consultation_slots
CREATE INDEX idx_consultation_slots_vendor_id ON consultation_slots(vendor_id);
CREATE INDEX idx_consultation_slots_slot_date ON consultation_slots(slot_date);
CREATE INDEX idx_consultation_slots_available ON consultation_slots(is_available, is_blocked);

-- consultation_bookings
CREATE INDEX idx_consultation_bookings_customer_id ON consultation_bookings(customer_id);
CREATE INDEX idx_consultation_bookings_vendor_id ON consultation_bookings(vendor_id);
CREATE INDEX idx_consultation_bookings_status ON consultation_bookings(status);
CREATE INDEX idx_consultation_bookings_booking_date ON consultation_bookings(booking_date);

-- consultation_pre_info
CREATE INDEX idx_consultation_pre_info_booking_id ON consultation_pre_info(booking_id);
```

---

## Realtime

Enable realtime for bookings so vendors see new bookings instantly:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE consultation_bookings;
```

---

## Migration File

A single migration file will be created:

**File**: `supabase/migrations/[timestamp]_pharmacy_consultation_system.sql`

This file will contain:
1. Helper functions (security definer)
2. All 5 tables with constraints
3. RLS enabled on all tables
4. All RLS policies
5. All indexes
6. Triggers for updated_at and auto-blocking
7. Realtime publication

---

## Summary

| Table | Purpose |
|-------|---------|
| consultation_types | What consultations a pharmacy offers |
| consultation_availability | Weekly recurring business hours |
| consultation_slots | Individual bookable time slots |
| consultation_bookings | Customer bookings with status tracking |
| consultation_pre_info | Sensitive health info collected before consultation |

**Security Features**:
- Security definer functions to avoid RLS recursion
- Vendors can only access their own pharmacy data
- Customers can only see/modify their own bookings
- Pre-info is only visible to the customer who created it and the pharmacy
- Admin access via existing `has_role()` function

**Automation**:
- Slots auto-blocked when booked
- Slots auto-released when booking cancelled
- Timestamps auto-updated

