

## Admin Onboarding Section

**Goal**: Add an admin page at `/admin/onboarding` where admins can manually create vendor or customer accounts on their behalf — filling in the details, creating the auth user, assigning roles, and setting up profiles.

### Implementation Steps

1. **Create `src/pages/admin/AdminOnboarding.tsx`**
   - Tabbed UI with two tabs: "Onboard Vendor" and "Onboard Customer"
   - **Vendor tab**: Form with fields matching `VendorSignup.tsx` (full name, email, phone, password, business name, business type, business description, business phone, business address, estate selection)
     - On submit: calls `supabase.auth.signUp()` to create the user, then inserts into `vendor_profiles` with `is_approved: true` (since admin is onboarding, auto-approve)
     - Also inserts `user_roles` row with role `vendor`
   - **Customer tab**: Form with fields matching `Signup.tsx` (full name, email, phone, password)
     - On submit: calls `supabase.auth.signUp()`, upserts `profiles`, inserts `user_roles` with role `customer`
   - Admin-only page protected by `ProtectedRoute` with `requiredRole="admin"`
   - Includes success/error toasts, loading states, and a "back to dashboard" link

2. **Add route in `src/App.tsx`**
   - Add lazy import for `AdminOnboarding`
   - Add route `/admin/onboarding` wrapped in `<ProtectedRoute requiredRole="admin">`

3. **Add navigation card in `src/pages/admin/AdminDashboard.tsx`**
   - New card in the management grid with a `UserPlus` icon labeled "Onboard Users"
   - Links to `/admin/onboarding`

### Security Note
- The admin creates the auth account via `supabase.auth.signUp()` client-side. This means the new user will receive a confirmation email. The admin sets a temporary password the user can change later.
- Role assignment uses existing `user_roles` table pattern with RLS.

