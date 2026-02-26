

# Plan: Remove Paystack/M-Pesa + Fix All Remaining Issues

## Scope

1. Remove all Paystack payment integration (frontend pages, edge functions, checkout options)
2. Remove M-Pesa payment integration (service, checkout options, STK push flow)
3. Fix order tracking route protection (re-add `ProtectedRoute`)
4. Clean up checkout to only keep working payment methods (Wallet, placeholder "Pay on Delivery")
5. Clean up orphaned files and references
6. Optimize QueryClient for scalability

---

## Files to Delete

| File | Reason |
|------|--------|
| `src/pages/PaystackCallback.tsx` | Paystack-specific callback page |
| `src/pages/PaymentCallbackPage.tsx` | Paystack verification page |
| `src/pages/PaymentFailed.tsx` | Paystack failure page |
| `src/pages/PaymentLogsPage.tsx` | Payment logs tied to Paystack provider |
| `src/services/paymentService.ts` | M-Pesa + Paystack retry service |
| `src/services/OrderPaymentSection.tsx` | Paystack retry UI component |
| `src/pages/OrderPaymentSection.tsx` | Empty file |
| `supabase/functions/payments-paystack-init/index.ts` | Paystack init edge function |
| `supabase/functions/payments-paystack-webhook/index.ts` | Paystack webhook edge function |
| `supabase/functions/payments-verify/index.ts` | Paystack verify edge function |

## Files to Modify

### `src/App.tsx`
- Remove imports: `PaystackCallback`, `PaymentCallbackPage`, `PaymentFailed`
- Remove routes: `/payment/callback`, `/paystack/callback`, `/payment-failed`
- Re-wrap `/orders/:orderId` with `<ProtectedRoute>`
- Add `staleTime` and `gcTime` to `QueryClient` for scalability

### `src/pages/Checkout.tsx`
- Remove import of `initiateMpesaPayment`, `checkPaymentStatus` from paymentService
- Remove all Paystack payment flow (`handleRetryPaystack`, paystack init invoke, redirect logic)
- Remove M-Pesa STK push flow (lines 666-712)
- Remove M-Pesa phone state, editing UI, validation
- Remove payment method options: `mpesa`, `mpesa_buygoods`, `paystack`, `split`
- Keep only: `wallet` and add a new `pay_on_delivery` option
- Remove `paystackError`, `isRetrying`, `retryOrderId` state
- Clean up review step text references to M-Pesa/Paystack
- Simplify the order placement to just create the order and show animation (no external payment redirect)

### `src/pages/OrderDetailsPage.tsx`
- Remove `OrderPaymentSection` import and usage
- Keep dispute form and order display

### `src/lib/schemas/checkoutSchema.ts`
- Remove `mpesa`, `mpesa_buygoods`, `mpesa_paybill`, `paystack`, `split` from payment method enum
- Keep `wallet`, add `pay_on_delivery`
- Remove `mpesaPhoneSchema`, `paybillSchema`, `tillNumberSchema`
- Remove M-Pesa-specific validation in `validatePaymentStep`
- Remove `validateMpesaPhone` export

### `supabase/config.toml`
- Remove function config blocks for `payments-paystack-init`, `payments-verify`, `payments-paystack-webhook`

### `src/config/env.ts`
- Remove `mpesa` config block

### `src/pages/OrderTracking.tsx`
- Change hardcoded "Payment Method: M-PESA (Paid)" text to generic "Payment: Confirmed"

## Summary of Fixes

| Issue | Fix |
|-------|-----|
| Paystack callback URL wrong | Removed entirely |
| payments-verify `user_id` vs `customer_id` | Removed entirely |
| Order tracking unprotected | Re-wrapped with `ProtectedRoute` |
| Fake email in Paystack | Removed entirely |
| M-Pesa backend doesn't exist | Removed entirely |
| Paystack reference collision | Removed entirely |
| QueryClient no cache config | Add `staleTime: 30000`, `gcTime: 300000` |

Payment integration will be replaced later with a different API. For now, orders use "MtaaLoop Wallet" or "Pay on Delivery."

