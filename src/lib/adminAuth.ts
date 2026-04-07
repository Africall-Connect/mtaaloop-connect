import { supabase } from "@/integrations/supabase/client";

// Module-level flag set during admin-on-behalf signup so the auth listener
// in useAuth knows to ignore the brief auth swap and not re-fetch roles /
// trigger a redirect away from the admin's current page.
export let suppressAuthListener = false;
export function setSuppressAuthListener(v: boolean) { suppressAuthListener = v; }

/**
 * Sign up a new user without losing the current admin's session.
 *
 * supabase.auth.signUp automatically signs the new user in (replacing the
 * admin's session). To work around that, we capture the admin's session
 * first, perform the signup, then immediately restore the admin session.
 *
 * Used by AdminOnboarding.tsx and AdminVendorManagement.tsx (vendor invite).
 */
export async function signUpAsAdmin(
  email: string,
  password: string,
  metadata: Record<string, any> = {}
) {
  // 1. Capture the current admin session
  const { data: { session: adminSession } } = await supabase.auth.getSession();

  // 2. Suppress the auth listener so it doesn't react to the brief swap
  setSuppressAuthListener(true);
  try {
    // 3. Create the new user (this overwrites the current session)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    // 4. Restore the admin session immediately
    if (adminSession?.access_token && adminSession?.refresh_token) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }

    return authData.user;
  } finally {
    // Re-enable the listener after a short delay so any in-flight events
    // settle before we resume normal handling.
    setTimeout(() => setSuppressAuthListener(false), 500);
  }
}

/**
 * Generate a random temporary password that meets MtaaLoop's auth rules:
 * at least 8 chars, includes uppercase, lowercase, and a digit.
 */
export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  // Guarantee one of each required class, then fill to 10 chars
  let pw = pick(upper) + pick(lower) + pick(digits);
  for (let i = 0; i < 7; i++) pw += pick(all);
  // Shuffle
  return pw
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
