
# Display Booking Services on Home and Landing Pages

## Problem Summary

The booking system for vendors with `operational_category = 'booking'` (like Beauty & Spa, Accommodation) is fully functional:
- Vendors can create booking service types in `VendorBookingManagement.tsx`
- Customers can book services in `VendorHome.tsx` via `BookingView.tsx`
- Booking flow (`BookingFlow.tsx`) creates reservations in `booking_reservations`

However, **booking services are NOT displayed on**:
1. **Home.tsx** - Only shows products, pharmacies, and minimarts
2. **Index.tsx** (landing page) - Only shows products grouped by operational type

The current pages only fetch from the `products` table. They need to also fetch from `booking_service_types` to display bookable services.

---

## Solution Overview

### 1. Create a Booking Services Section for Home.tsx

Add a new section similar to "Health & Consultations" that displays:
- Vendors with `operational_category = 'booking'` (e.g., Beauty & Spa, Salons)
- Their available booking service types with pricing and duration
- "Book Now" button that navigates to the vendor's booking page

### 2. Integrate Booking Services into Index.tsx

The landing page has a "Book a Service" section but it only shows products. Need to:
- Fetch actual booking service types from vendors
- Display service cards with "Book" action that requires login

### 3. Create My Bookings Page for Customers

Similar to `MyConsultations.tsx`, create a page where customers can:
- View upcoming, past, and cancelled bookings
- Cancel pending/confirmed bookings
- See booking details (service, date, time, vendor)

---

## Technical Implementation

### Files to Create

| File | Description |
|------|-------------|
| `src/pages/MyBookings.tsx` | Customer's booking history page (mirrors MyConsultations.tsx) |
| `src/components/home/BookingServicesSection.tsx` | Reusable section component for Home.tsx |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Home.tsx` | Add booking vendors section, fetch booking_service_types |
| `src/pages/Index.tsx` | Fetch and display booking services in "Book a Service" section |
| `src/App.tsx` | Add route for `/my-bookings` |
| `src/lib/bookingUtils.ts` | Add `formatBookingDateTime` helper if not present |

---

## Detailed Changes

### Home.tsx Changes

**Add state for booking vendors:**
```typescript
const [bookingVendors, setBookingVendors] = useState<VendorProfile[]>([]);
```

**Add useEffect to fetch booking vendors:**
```typescript
// Fetch vendors with operational_category = 'booking'
useEffect(() => {
  const fetchBookingVendors = async () => {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('operational_category', 'booking')
      .eq('is_approved', true)
      .eq('is_active', true)
      .limit(4);
    
    if (!error) setBookingVendors(data || []);
  };
  fetchBookingVendors();
}, []);
```

**Add Booking Services Section (after Health & Consultations):**
```typescript
{bookingVendors.length > 0 && (
  <section className="mb-8 mt-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-full">
        <CalendarCheck className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg md:text-2xl font-bold">Book a Service</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Beauty, spa, accommodation and more
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {bookingVendors.map((vendor) => (
        <BookingVendorCard 
          key={vendor.id} 
          vendor={vendor} 
          onClick={() => navigate(`/vendor/${vendor.slug}`)}
        />
      ))}
    </div>
    
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" size="sm" onClick={() => navigate('/beauty-db')}>
        View All Beauty & Spa
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/my-bookings')}>
        <CalendarCheck className="h-4 w-4 mr-2" />
        My Bookings
      </Button>
    </div>
  </section>
)}
```

### Index.tsx Changes

**Create BookingServiceWithVendor interface:**
```typescript
interface BookingServiceWithVendor {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  vendor_id: string;
  vendor: {
    id: string;
    business_name: string;
    slug: string;
  };
}
```

**Add state and fetch for booking services:**
```typescript
const [bookingServices, setBookingServices] = useState<BookingServiceWithVendor[]>([]);

useEffect(() => {
  const fetchBookingServices = async () => {
    const { data, error } = await supabase
      .from('booking_service_types')
      .select(`
        id, name, description, price, duration_minutes, category, vendor_id,
        vendor_profiles!inner (id, business_name, slug, is_approved, is_active)
      `)
      .eq('is_active', true)
      .eq('vendor_profiles.is_approved', true)
      .eq('vendor_profiles.is_active', true)
      .limit(12);
    
    if (!error) {
      const transformed = data.map(s => ({
        ...s,
        vendor: s.vendor_profiles
      }));
      setBookingServices(transformed);
    }
  };
  fetchBookingServices();
}, []);
```

**Create BookingServiceSection component:**
Display booking services with a service card showing:
- Service name
- Duration (e.g., "1 hour")
- Price
- Vendor name
- "Book" button (requires login)

### MyBookings.tsx (New Page)

Create a page mirroring `MyConsultations.tsx` structure:
- Fetch from `booking_reservations` with joins to `booking_service_types` and `vendor_profiles`
- Tabs: Upcoming | Past | Cancelled
- Booking cards showing service name, date, time, vendor, price
- Cancel button for pending/confirmed bookings
- Use `BOOKING_STATUS_LABELS` from `src/types/booking.ts`

### App.tsx Changes

Add new route:
```typescript
import MyBookings from "./pages/MyBookings";

// In Routes
<Route path="/my-bookings" element={
  <ProtectedRoute>
    <MyBookings />
  </ProtectedRoute>
} />
```

---

## UI/UX Considerations

1. **Consistent Card Design**: Booking vendor cards should match the pharmacy card design
2. **Duration Display**: Use `DURATION_OPTIONS` from `types/booking.ts` to show friendly labels
3. **Login Gate**: Both pages enforce login for booking actions (consistent with current behavior)
4. **Mobile Responsive**: Grid adjusts from 2 columns on mobile to 4 on desktop

---

## Database Queries

The implementation uses existing tables:
- `vendor_profiles` - filtered by `operational_category = 'booking'`
- `booking_service_types` - active services with vendor info
- `booking_reservations` - customer's booking history

No database migrations required - all tables already exist from the booking system implementation.

---

## Summary of Changes

| Area | Change |
|------|--------|
| Home.tsx | Add "Book a Service" section with booking vendors |
| Index.tsx | Fetch and display booking services in services section |
| MyBookings.tsx | New page for customer booking history |
| App.tsx | Add `/my-bookings` route |
| Navigation | Add "My Bookings" link to Home.tsx and Account page |
