/**
 * Single source of truth for "where does this user belong?"
 * Used by Login.tsx (post-signin redirect) and ProtectedRoute.tsx (fallback
 * when a user lacks the required role for a page).
 *
 * Returns the path of the user's home dashboard for their primary role,
 * or null if they have no recognised role.
 */
export function getRoleHomeRoute(roles: string[] | null | undefined): string | null {
  if (!roles || roles.length === 0) return null;
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("customer_rep")) return "/csr/dashboard";
  if (roles.includes("vendor")) return "/vendor/dashboard";
  if (roles.includes("rider")) return "/rider/dashboard";
  if (roles.includes("agent")) return "/agent/dashboard";
  if (roles.includes("estate_manager") || roles.includes("estate")) return "/estate/dashboard";
  if (roles.includes("customer")) return "/home";
  return null;
}
