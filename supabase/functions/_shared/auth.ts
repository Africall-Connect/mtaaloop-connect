import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

export interface RoleCheckResult {
  authorized: boolean;
  error?: string;
}

/**
 * Verify JWT token from Authorization header using getClaims()
 * Returns user info if valid, error otherwise
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  
  // Create client with the user's auth header
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const { data, error } = await supabaseClient.auth.getClaims(token);
    
    if (error || !data?.claims) {
      console.error("[auth] getClaims error:", error);
      return { authenticated: false, error: "Invalid or expired token" };
    }

    return {
      authenticated: true,
      userId: data.claims.sub as string,
      email: data.claims.email as string,
    };
  } catch (err) {
    console.error("[auth] Unexpected error verifying token:", err);
    return { authenticated: false, error: "Token verification failed" };
  }
}

/**
 * Check if user has a specific role in the user_roles table
 * Uses service role to bypass RLS
 */
export async function requireRole(
  userId: string,
  requiredRole: string
): Promise<RoleCheckResult> {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", requiredRole)
      .maybeSingle();

    if (error) {
      console.error("[auth] Role check error:", error);
      return { authorized: false, error: "Failed to verify role" };
    }

    if (!data) {
      return { authorized: false, error: `${requiredRole} access required` };
    }

    return { authorized: true };
  } catch (err) {
    console.error("[auth] Unexpected error checking role:", err);
    return { authorized: false, error: "Role verification failed" };
  }
}

/**
 * Create a standardized unauthorized response
 */
export function createUnauthorizedResponse(
  message: string,
  corsHeaders: Record<string, string>,
  status: number = 401
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Create a standardized forbidden response (authenticated but not authorized)
 */
export function createForbiddenResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return createUnauthorizedResponse(message, corsHeaders, 403);
}

/**
 * Combined helper: Verify auth and require admin role
 * Returns the userId if successful, or a Response to return if not
 */
export async function requireAdmin(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<{ userId: string } | Response> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.authenticated || !authResult.userId) {
    return createUnauthorizedResponse(
      authResult.error || "Unauthorized",
      corsHeaders
    );
  }

  const roleResult = await requireRole(authResult.userId, "admin");
  
  if (!roleResult.authorized) {
    return createForbiddenResponse(
      roleResult.error || "Admin access required",
      corsHeaders
    );
  }

  return { userId: authResult.userId };
}

/**
 * Get admin Supabase client (service role)
 */
export function getAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
