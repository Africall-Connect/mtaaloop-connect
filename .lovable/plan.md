

# Fix POS Cart Panel Layout

## Problem
The discount, payment method, and customer fields are inside the `ScrollArea`, pushing the Subtotal/Total/Clear/Complete Sale section below the fold. Users must scroll to reach the action buttons.

## Root Cause
In `CartPanel` (line 517-606), the `ScrollArea` contains both the cart items AND the discount/payment/customer fields. This makes the scrollable area too tall, and the fixed footer at line 608-636 gets pushed off-screen.

## Fix

### 1. Move discount/payment/customer fields OUT of ScrollArea into the sticky footer

The `ScrollArea` should ONLY contain the cart item list. The discount, payment method, and customer info fields move into the bottom fixed section alongside subtotal/total/buttons.

### 2. Constrain desktop sidebar height

The desktop cart panel container (line 353) needs `h-[calc(100vh-<header>)]` so the flex column layout works properly and the panel doesn't grow beyond the viewport.

### 3. Mobile sheet — add safe-area padding

Add `pb-[env(safe-area-inset-bottom)]` to the footer section so the Complete Sale button clears any mobile navigation/notch area.

## File Changes

**`src/pages/vendor/VendorPOS.tsx`**

1. **Desktop sidebar container** (line 353): Add height constraint
   ```tsx
   <div className="hidden lg:flex w-[380px] border-l bg-card flex-col h-[calc(100vh-57px)]">
   ```

2. **CartPanel component** (lines 516-638): Restructure so ScrollArea only contains cart items, and all other fields + actions go in the sticky bottom:

   ```tsx
   function CartPanel({ ... }) {
     return (
       <div className="flex flex-col h-full overflow-hidden">
         {/* Scrollable items only */}
         <ScrollArea className="flex-1 min-h-0 p-4">
           {cart.length === 0 ? (
             // empty state
           ) : (
             // cart items list only
           )}
         </ScrollArea>

         {/* Fixed bottom: discount, payment, subtotal, buttons */}
         {cart.length > 0 && (
           <div className="shrink-0 border-t p-4 space-y-3 bg-card pb-[calc(1rem+env(safe-area-inset-bottom))]">
             {/* Discount input */}
             {/* Payment method buttons */}
             {/* Customer name/phone (collapsible or compact) */}
             <Separator />
             {/* Subtotal / Discount / Total */}
             {/* Clear + Complete Sale buttons */}
           </div>
         )}
       </div>
     );
   }
   ```

3. **Mobile sheet** (line 379): Ensure the sheet content allows the CartPanel to fill properly with `overflow-hidden` on the wrapper.

## Key Principles
- `ScrollArea` gets `min-h-0` + `flex-1` so it shrinks to available space
- Footer gets `shrink-0` so it never compresses
- Parent container gets `overflow-hidden` to enforce the constraint
- Safe-area inset on the footer bottom padding for mobile devices

