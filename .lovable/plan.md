

## Fix: Checkout page not rendering properly

**Root cause**: The query to `customer_addresses` table (lines 101-116) references a table that doesn't exist in the database, causing an uncaught error that may prevent the page from rendering correctly — hiding the "Continue to Payment" button and other UI elements.

### Implementation

**Edit `src/pages/Checkout.tsx`**:

1. **Remove the broken `customer_addresses` query** (lines 101-116) — this table doesn't exist in the schema
2. **Replace with localStorage lookup** — read the apartment context from `localStorage` (key: `selectedApartment`) which stores `{"house_name":"..."}`, and use it to pre-fill `house_number`
3. The estate name is already populated from `user_preferences` (lines 79-98), so no change needed there

This is a single targeted fix: delete ~16 lines querying a non-existent table and add ~5 lines reading from localStorage instead.

