

## System Health Audit: Issues Found

### Critical Issue: Missing Service Tracking Route & Page
All 6 Quick Services (Trash Collection, Quick Cleaning, Laundry Sorting, etc.) navigate to `/service-tracking/:requestId` after a service request is submitted. **This route does not exist in `App.tsx` and there is no `ServiceTracking` page component.** This means after a customer requests any Quick Service, they hit a 404 page.

Additionally, the `ServiceRequestForm` inserts into a `service_requests` Supabase table that likely does not exist in the database (no migration found), so the insert would fail with an error before even reaching the missing route.

### Other Issues Detected
1. **`user_subscriptions` table missing** -- Network requests show 404 errors for this table. The code falls back to mock data gracefully, but subscription features are non-functional.
2. **Framer Motion scroll warning** -- Console warns about non-static positioned containers for parallax components. Cosmetic but indicates the parallax cards may not calculate offsets correctly.

### Plan: Fix Service Request Flow End-to-End

**Step 1: Create `src/pages/ServiceTracking.tsx`**
- New page that fetches a service request by ID from Supabase (or shows mock/fallback if table doesn't exist)
- Displays: service name, status (pending/assigned/in-progress/completed), assigned agent info, customer notes, scheduled time
- Category-specific waiting bay messaging reusing the pattern from `OrderTracking.tsx` (unique wording per service type)
- Progress stepper: Requested → Agent Assigned → In Progress → Completed

**Step 2: Register the route in `App.tsx`**
- Add lazy import for `ServiceTracking`
- Add route: `/service-tracking/:requestId` inside `ProtectedRoute`

**Step 3: Fix parallax container warning**
- Add `position: relative` to the Services section wrapper in `Home.tsx` to resolve the framer-motion scroll offset warning

### Files to Edit
- **Create**: `src/pages/ServiceTracking.tsx`
- **Edit**: `src/App.tsx` -- add lazy import + route
- **Edit**: `src/pages/Home.tsx` -- add `relative` class to services section

