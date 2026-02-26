

# Pre-Launch Improvements for 10,000 Users

## Current Gaps Found

1. **No code splitting** -- All 160+ pages are eagerly loaded in one bundle. Every user downloads the entire app on first visit, causing slow initial load times.
2. **No error boundary** -- Any runtime error crashes the entire app with a white screen. No graceful recovery.
3. **Duplicate Supabase clients** -- `src/integrations/supabase/client.ts` and `src/lib/supabaseClient.ts` both create separate clients with slightly different configs. Some hooks use one, some use the other, causing session inconsistencies.
4. **QueryClient missing retry/refocus config** -- No `retry` limit or `refetchOnWindowFocus` control. Failed queries retry infinitely by default, and every tab focus triggers refetches across all queries.
5. **No loading skeletons or Suspense boundaries** -- Lazy-loaded routes need fallback UI.

## Plan

### 1. Add React.lazy code splitting for heavy route groups
**File:** `src/App.tsx`
- Wrap all page imports (except Index, Login, Signup) with `React.lazy(() => import(...))`
- Add `<Suspense fallback={<LoadingSpinner />}>` around `<Routes>`
- This alone can reduce initial bundle size by 60-80%

### 2. Add a global ErrorBoundary
**File:** `src/components/ErrorBoundary.tsx` (new)
- Create a class component that catches render errors
- Shows a friendly "Something went wrong" UI with a retry button
- Wrap the app in `src/App.tsx` with this boundary

### 3. Consolidate duplicate Supabase clients
**File:** `src/lib/supabaseClient.ts`
- Re-export from `src/integrations/supabase/client.ts` instead of creating a second client
- This prevents session drift between the two clients

### 4. Tune QueryClient defaults
**File:** `src/App.tsx`
- Add `retry: 2` (don't retry forever)
- Add `refetchOnWindowFocus: false` (prevent excessive refetches with many tabs)

These four changes directly address the biggest scalability and reliability risks for a 10k-user launch.

