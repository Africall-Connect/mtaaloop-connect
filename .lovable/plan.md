

## Plan: Add Zod Validation + Rider Onboarding Tab

### Changes to `src/pages/admin/AdminOnboarding.tsx`

**1. Add Zod validation schemas**
- Shared base schema: `fullName` (2-100 chars), `email` (valid format), `phone` (Kenyan format `+254` or `07xx`, 10-15 digits), `password` (min 8 chars, must contain uppercase, lowercase, and number)
- Vendor schema: extends base with `businessName` (required, 2-100), `businessType` (required), `businessPhone` (same phone validation)
- Customer schema: base schema only
- Rider schema: extends base with `idNumber` (required), `vehicleType` (required), optional `vehicleRegistration` and `licenseNumber`

**2. Integrate validation into submit handlers**
- Parse form data with Zod before calling Supabase
- Display field-level validation errors below each input using red text
- Clear errors on successful submission or when user modifies the field

**3. Add Rider/Delivery Agent tab (3rd tab)**
- Fields: fullName, email, phone, password, idNumber, vehicleType, vehicleRegistration (conditional), licenseNumber (conditional), estateId (optional)
- On submit: `supabase.auth.signUp()` → insert into `rider_profiles` (with `is_approved: true` since admin is onboarding) → insert `user_roles` with role `rider`
- TabsList changes from `grid-cols-2` to `grid-cols-3`
- Add `Bike` icon from lucide-react for the tab

**4. Update header subtitle**
- Change "vendor or customer" to "vendor, customer, or delivery agent"

### Files Modified
- `src/pages/admin/AdminOnboarding.tsx` — full rewrite with Zod schemas, validation errors state, rider tab, and rider submit handler

