

# Environment Variables Configuration Plan

## Overview
Configure your Supabase and Pusher credentials in the codebase. Since these are publishable/client-side keys (except Pusher secret), they can be safely added to the code.

---

## What Will Be Done

### 1. Update Supabase Configuration
Create/update a config file with your Supabase credentials:
- `VITE_SUPABASE_URL`: https://oxehayneipjiozpuxlnv.supabase.co
- `VITE_SUPABASE_ANON_KEY`: Your provided anon key

### 2. Update Pusher Configuration
Add Pusher client credentials:
- `VITE_PUSHER_KEY`: 92acec48c588575d855e
- `VITE_PUSHER_CLUSTER`: eu

### 3. Revert Supabase Client
Update `src/integrations/supabase/client.ts` to use hardcoded values since we now have the credentials.

### 4. Update Pusher Context
Update `src/contexts/PusherContext.tsx` to use the Pusher credentials.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/integrations/supabase/client.ts` | Add Supabase URL and anon key directly |
| `src/contexts/PusherContext.tsx` | Add Pusher key and cluster directly |
| `src/lib/supabaseClient.ts` | Update to use the credentials |
| `src/config/env.ts` | Update with actual values |

---

## Security Notes

- **Safe to include in code**: Supabase URL, Supabase anon key, Pusher key, Pusher cluster
- **Do NOT include**: `VITE_PUSHER_SECRET` - this is a server-side only secret
- The Pusher secret should only be used in Supabase Edge Functions if you implement server-side Pusher triggers

---

## Technical Details

The Supabase anon key is designed to be public - it works with Row Level Security (RLS) policies to control access. The Pusher key is also a client-side publishable key.

