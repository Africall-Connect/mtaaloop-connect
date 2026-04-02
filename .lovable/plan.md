

# Fix Order Creation Bug + Build Vendor Onboarding Pipeline

## Part 1: Fix "Failed to create order" Error

**Root Cause**: In `Checkout.tsx` line 267, the "regular" order type uses `total` (the global cart total including delivery fee and discounts for ALL items) instead of `totalAmount` (the per-group subtotal computed on line 190 for just that group's items). When earlier order groups call `removeItem()`, the cart state changes and `total` can become stale or incorrect. Additionally, the insert on line 265 lacks `.select().single()` so DB errors aren't properly surfaced.

**Fix in `src/pages/Checkout.tsx`**:
- Line 267: Change `total_amount: total` to `total_amount: totalAmount + deliveryFee`
- Add proper error handling with `.select().single()` and extract the Supabase error message
- Also fix the error catch block (line 284) to handle PostgrestError properly

---

## Part 2: Public Vendor Onboarding Form

### New file: `src/pages/VendorOnboarding.tsx`

A public, shareable page at `/vendor-onboarding` (no login required) with MtaaLoop branding:

- MtaaLoop logo at top + tagline
- Collects: Full Name, Email, Phone, Business Name, Business Type (from `MAIN_CATEGORIES`), Business Description, Business Phone, Business Address, Estate selection (inside/outside), optional ID/permit upload reference
- Zod validation before submission
- On submit: calls `supabase.auth.signUp()` to create user, then inserts `vendor_profiles` with `is_approved: false`
- Success screen: "Application submitted and under review"
- Mobile-friendly, clean card-based layout

### Route registration in `src/App.tsx`

- Add lazy import for `VendorOnboarding`
- Add public route: `<Route path="/vendor-onboarding" element={<VendorOnboarding />} />`

### Admin Approval (Already Exists)

The existing `VendorApprovals` page at `/admin/vendor-approvals` already handles:
- Listing pending vendors (is_approved=false, no rejection_reason)
- Approve button (calls `approve_vendor` RPC)
- Reject button with reason

No changes needed to admin approval — just verify the existing flow works with the new onboarding form's data.

---

## Files to Create/Edit

| File | Change |
|------|--------|
| `src/pages/Checkout.tsx` | Fix line 267: `total` → `totalAmount + deliveryFee`; add `.select().single()`; fix error extraction |
| `src/pages/VendorOnboarding.tsx` | **New** — Public vendor onboarding form with MtaaLoop branding |
| `src/App.tsx` | Add lazy import + public route for `/vendor-onboarding` |

## Shareable Link

The vendor onboarding link will be: `https://mtaaloop.lovable.app/vendor-onboarding`

