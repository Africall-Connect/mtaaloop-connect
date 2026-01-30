

# JWT Verification for Edge Functions - Implementation Plan

## Overview

This plan adds JWT verification using `getClaims()` to all authenticated edge functions, ensuring that only authorized users can access protected endpoints while maintaining public access for webhooks.

---

## Current State Analysis

### Edge Functions Inventory

| Function | Current Auth | Should Require JWT | Notes |
|----------|-------------|-------------------|-------|
| `payments-paystack-init` | ❌ None | ✅ Yes | User must be logged in to initiate payment |
| `payments-verify` | ❌ None | ✅ Yes | User verifying their own payment |
| `admin-vendor-payouts` | ⚠️ Shared secret only | ✅ Yes + Admin role | Admin-only endpoint |
| `get-users` | ❌ None | ✅ Yes + Admin role | Lists all users - admin only |
| `generate-image` | ❌ None | ✅ Yes | User-facing feature |
| `payments-paystack-webhook` | ✅ HMAC signature | ❌ No | Public webhook from Paystack |
| `pusher-trigger` | ⚠️ verify_jwt=true in config | ❌ Keep as-is | Already configured |

### Current config.toml Settings

```toml
[functions.generate-image]
verify_jwt = false

[functions.pusher-trigger]
verify_jwt = true
```

Most functions have no explicit JWT configuration, defaulting to no verification.

---

## Implementation Strategy

### Create Shared Auth Helper

Create a reusable auth verification module that all functions can import:

```text
supabase/functions/_shared/
├── cors.ts          (existing)
└── auth.ts          (new - JWT verification helper)
```

### auth.ts Helper Functions

```typescript
// Verify JWT and return user claims
export async function verifyAuth(req: Request, supabase: SupabaseClient): Promise<{
  authenticated: boolean;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
}>

// Check if user has specific role (queries user_roles table)
export async function requireRole(
  supabase: SupabaseClient, 
  userId: string, 
  requiredRole: string
): Promise<{ authorized: boolean; error?: string }>

// Combined helper for protected endpoints
export function createUnauthorizedResponse(message: string, corsHeaders: Record<string, string>)
```

---

## Changes Per Function

### 1. payments-paystack-init (User Auth Required)

**Purpose**: Users initiate payment for their orders

**Changes**:
- Add JWT verification using `getClaims()`
- Verify the user owns the order being paid for
- Return 401 if not authenticated

```typescript
// Add after CORS handling
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } },
});

const token = authHeader.replace('Bearer ', '');
const { data: claims, error: authError } = await supabaseClient.auth.getClaims(token);
if (authError || !claims?.claims) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const userId = claims.claims.sub;
// Continue with order validation...
```

**Additional Security**: Verify user owns the order:
```typescript
const { data: order } = await supabaseAdmin
  .from("orders")
  .select("user_id, total_amount, user_email")
  .eq("id", order_id)
  .single();

if (order.user_id !== userId) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

### 2. payments-verify (User Auth Required)

**Purpose**: Users verify their payment status

**Changes**:
- Add JWT verification
- Verify user owns the payment/order being checked

```typescript
// After getting the payment, verify ownership
const { data: order } = await supabaseAdmin
  .from("orders")
  .select("user_id")
  .eq("id", payment.order_id)
  .single();

if (order.user_id !== userId) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

### 3. admin-vendor-payouts (Admin Role Required)

**Purpose**: Admin manages vendor payouts

**Changes**:
- Replace shared secret with JWT + admin role check
- Keep shared secret as fallback for automated systems

```typescript
// Primary: JWT-based admin auth
const authHeader = req.headers.get('Authorization');
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.replace('Bearer ', '');
  const { data: claims } = await supabaseClient.auth.getClaims(token);
  
  if (claims?.claims?.sub) {
    // Check admin role in user_roles table
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', claims.claims.sub)
      .eq('role', 'admin')
      .single();
    
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Authorized as admin, continue...
  }
}

// Fallback: shared secret for automated systems
const secretHeader = req.headers.get('x-admin-secret');
if (!secretHeader || secretHeader !== adminSecret) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

### 4. get-users (Admin Role Required)

**Purpose**: List all users for admin dashboard

**Changes**:
- Add JWT verification
- Require admin role

```typescript
// Verify admin access
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } },
});

const token = authHeader.replace('Bearer ', '');
const { data: claims, error: authError } = await supabaseClient.auth.getClaims(token);
if (authError || !claims?.claims) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Check admin role
const { data: roleData } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', claims.claims.sub)
  .eq('role', 'admin')
  .single();

if (!roleData) {
  return new Response(JSON.stringify({ error: 'Admin access required' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

### 5. generate-image (User Auth Required)

**Purpose**: AI image generation for logged-in users

**Changes**:
- Add JWT verification
- Optional: Rate limiting per user

```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ error: 'Authentication required' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } },
});

const token = authHeader.replace('Bearer ', '');
const { data: claims, error: authError } = await supabaseClient.auth.getClaims(token);
if (authError || !claims?.claims) {
  return new Response(
    JSON.stringify({ error: 'Invalid or expired token' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Can use claims.claims.sub for rate limiting or logging
const userId = claims.claims.sub;
console.log(`Image generation requested by user: ${userId}`);
```

---

### 6. payments-paystack-webhook (No JWT - Keep As-Is)

**Reason**: Webhooks come from Paystack servers, not authenticated users

**Current Security**: HMAC SHA512 signature verification ✅

No changes needed - already properly secured.

---

## Config Updates

### supabase/config.toml

```toml
[functions.payments-paystack-init]
verify_jwt = false  # We verify in code for better error handling

[functions.payments-verify]
verify_jwt = false  # We verify in code for better error handling

[functions.admin-vendor-payouts]
verify_jwt = false  # We verify in code with role check

[functions.get-users]
verify_jwt = false  # We verify in code with role check

[functions.generate-image]
verify_jwt = false  # We verify in code

[functions.payments-paystack-webhook]
verify_jwt = false  # Uses HMAC signature instead

[functions.pusher-trigger]
verify_jwt = true  # Keep existing
```

**Note**: Setting `verify_jwt = false` in config and verifying in code gives us:
- Custom error messages
- Ability to combine JWT with other auth methods
- Role-based access control
- Ownership verification

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `supabase/functions/_shared/auth.ts` | Shared JWT verification helpers |
| Modify | `supabase/functions/payments-paystack-init/index.ts` | Add user JWT verification + ownership check |
| Modify | `supabase/functions/payments-verify/index.ts` | Add user JWT verification + ownership check |
| Modify | `supabase/functions/admin-vendor-payouts/index.ts` | Add JWT + admin role check |
| Modify | `supabase/functions/get-users/index.ts` | Add JWT + admin role check |
| Modify | `supabase/functions/generate-image/index.ts` | Add user JWT verification |
| Modify | `supabase/config.toml` | Add function configurations |

---

## Frontend Compatibility

The frontend already passes the Authorization header automatically when using `supabase.functions.invoke()`. The Supabase client includes the user's JWT in requests when logged in.

Example from existing code:
```typescript
const { data, error } = await supabase.functions.invoke("payments-paystack-init", {
  body: { order_id: orderId },
});
// Authorization header is automatically included by Supabase client
```

**No frontend changes required** - the client SDK handles this.

---

## Security Summary

| Function | Before | After |
|----------|--------|-------|
| payments-paystack-init | Anyone can initiate | User must own the order |
| payments-verify | Anyone can verify any payment | User must own the payment |
| admin-vendor-payouts | Shared secret only | JWT + Admin role (with secret fallback) |
| get-users | Anyone can list users | Admin role required |
| generate-image | Anyone can generate | Authenticated users only |
| payments-paystack-webhook | HMAC signature | No change (correct) |

---

## Implementation Order

1. Create `_shared/auth.ts` helper module
2. Update `config.toml` with function settings
3. Update `payments-paystack-init` with JWT + ownership
4. Update `payments-verify` with JWT + ownership  
5. Update `admin-vendor-payouts` with JWT + admin role
6. Update `get-users` with JWT + admin role
7. Update `generate-image` with JWT
8. Test each endpoint

