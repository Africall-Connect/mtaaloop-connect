
# Require Login on Product/Vendor Interaction

## Overview

Allow non-authenticated users to browse products on the landing page, but require login when they try to interact (click on products or add to cart). Protected pages like Cart and Checkout are already secured.

---

## Current State

| Action | Currently | Desired |
|--------|-----------|---------|
| View landing page products | Public | Public |
| Click product → Vendor page | Public | Requires login |
| Add to cart button | Public (but cart is protected) | Requires login |
| View cart | Protected | Protected |
| Checkout | Protected | Protected |

---

## Changes to Make

### 1. Update `Index.tsx` - Add Auth Check on Interactions

Modify the landing page to check authentication when users try to:
- Click on a product card
- Click the "Add to Cart" button

If not authenticated, redirect to login with a return URL.

```typescript
// Add useAuth hook
import { useAuth } from "@/hooks/useAuth";

// In the Index component:
const { user } = useAuth();

const handleAddToCart = (e: React.MouseEvent, product: ProductWithVendor) => {
  e.stopPropagation();
  
  // Check if user is logged in
  if (!user) {
    toast({
      title: "Login Required",
      description: "Please login to add items to your cart",
      variant: "destructive",
    });
    navigate("/auth/login", { state: { returnTo: "/" } });
    return;
  }

  // ... existing add to cart logic
};

const handleProductClick = (product: ProductWithVendor) => {
  // Check if user is logged in
  if (!user) {
    toast({
      title: "Login Required", 
      description: "Please login to view product details",
      variant: "destructive",
    });
    navigate("/auth/login", { state: { returnTo: "/" } });
    return;
  }

  if (product.vendor?.slug) {
    navigate(`/vendor/${product.vendor.slug}`);
  }
};
```

### 2. Update `App.tsx` - Protect Vendor Storefront Routes

Wrap the vendor storefront routes with `ProtectedRoute`:

```typescript
// Change from:
<Route path="/vendor/:vendorSlug" element={<VendorHome />} />
<Route path="/vendor/:vendorSlug/category/:categorySlug" element={<VendorCategory />} />
<Route path="/vendor/:vendorSlug/category/:categorySlug/:subcategorySlug" element={<VendorSubcategory />} />
<Route path="/vendor/:vendorSlug/product/:productSlug" element={<ProductDetail />} />
<Route path="/minimart/:vendorId" element={<MinimartPage />} />

// Change to:
<Route path="/vendor/:vendorSlug" element={
  <ProtectedRoute>
    <VendorHome />
  </ProtectedRoute>
} />
<Route path="/vendor/:vendorSlug/category/:categorySlug" element={
  <ProtectedRoute>
    <VendorCategory />
  </ProtectedRoute>
} />
<Route path="/vendor/:vendorSlug/category/:categorySlug/:subcategorySlug" element={
  <ProtectedRoute>
    <VendorSubcategory />
  </ProtectedRoute>
} />
<Route path="/vendor/:vendorSlug/product/:productSlug" element={
  <ProtectedRoute>
    <ProductDetail />
  </ProtectedRoute>
} />
<Route path="/minimart/:vendorId" element={
  <ProtectedRoute>
    <MinimartPage />
  </ProtectedRoute>
} />
```

---

## User Experience Flow

```text
User (not logged in)
        │
        ▼
   Landing Page (/)
   [Browse products freely]
        │
        ├──── Clicks Product Card
        │         │
        │         ▼
        │    "Login Required" toast
        │    Redirect to /auth/login
        │         │
        │         ▼
        │    User logs in
        │         │
        │         ▼
        │    Redirect back to /
        │
        └──── Clicks Add to Cart (+)
                  │
                  ▼
             "Login Required" toast
             Redirect to /auth/login
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add `useAuth` hook, add login checks to `handleAddToCart` and `handleProductClick` |
| `src/App.tsx` | Wrap vendor storefront routes with `ProtectedRoute` |

---

## Technical Details

### Index.tsx Changes

1. Import `useAuth` hook
2. Get `user` from the hook
3. Add auth check at the start of `handleAddToCart`
4. Add auth check at the start of `handleProductClick`
5. Show toast notification when redirecting to login

### App.tsx Changes

Protect these routes (lines 634-638):
- `/vendor/:vendorSlug`
- `/vendor/:vendorSlug/category/:categorySlug`
- `/vendor/:vendorSlug/category/:categorySlug/:subcategorySlug`
- `/vendor/:vendorSlug/product/:productSlug`
- `/minimart/:vendorId`

---

## Summary

| Before | After |
|--------|-------|
| Anyone can view vendor pages | Login required for vendor pages |
| Anyone can click products | Login required to view details |
| Cart protected but add-to-cart is not | Add-to-cart requires login |
| No feedback when auth required | Toast notification explains why |

This approach gives users a frictionless browsing experience while gating actions that require user identity (shopping, viewing details, etc.).
