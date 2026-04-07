

# Fix Signature Field + Order Again Button

## 1. Vendor Onboarding — Replace text input with a canvas signature pad

**File: `src/pages/VendorOnboarding.tsx`**

Replace the `<Input>` at line 874 with an HTML5 `<canvas>` signature pad component built inline using `useRef` and touch/mouse events.

- Add a `signatureCanvasRef` and state `signatureDataUrl`
- Canvas handles `mousedown/mousemove/mouseup` + `touchstart/touchmove/touchend` for drawing
- "Clear Signature" button resets the canvas
- On form submit, convert canvas to base64 PNG via `canvas.toDataURL()` and store in `formData.vendorSignature`
- Canvas styled with border, rounded corners, ~200px height, full width
- Works on both desktop (mouse) and mobile (touch)

## 2. Fix HomeProductCard build error

**File: `src/components/home/HomeProductCard.tsx`** (line 69-76)

The `<Button>` tag on line 69 has no closing tag. Add `</Button>` after the `<Plus>` icon (before the closing `</div>`).

## 3. "Order Again" button — make it functional

**File: `src/pages/MyOrders.tsx`** (line 182-185)

Currently the button has no `onClick` handler. Fix:

- Import `useCart` and `useNavigate`
- On click: iterate `order.order_items`, call `addItem()` for each item with available data (name, price, quantity, vendor info)
- Then navigate to `/cart`
- Show toast: "Items added to cart"
- For items missing price data (e.g. from older orders), skip them and show a warning

The `addItem` call will use: `id` (generate new), `name: item.product_name`, `price: item.price || item.subtotal/item.quantity`, `quantity: item.quantity`, `vendorId` and `vendorName` from `order.vendor_profiles`.

## Files to Edit

| File | Change |
|------|--------|
| `src/pages/VendorOnboarding.tsx` | Replace signature `<Input>` with canvas drawing pad |
| `src/components/home/HomeProductCard.tsx` | Fix missing `</Button>` closing tag |
| `src/pages/MyOrders.tsx` | Wire up "Order Again" with `useCart().addItem` + navigate to cart |

