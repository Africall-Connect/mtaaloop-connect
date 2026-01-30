import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth, requireRole, createUnauthorizedResponse, createForbiddenResponse } from "../_shared/auth.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminSecret = Deno.env.get("ADMIN_PAYOUT_SECRET") ?? "change-me";

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Types
interface VendorProfile {
  business_name: string | null;
  contact_phone: string | null;
}

interface PayoutRecord {
  id: string;
  vendor_id: string;
  order_id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  paid_reference: string | null;
  paid_by: string | null;
  vendor_profiles: {
    business_name: string | null;
    contact_phone: string | null;
  } | null;
}

// Basic CORS helper
const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret, Authorization, authorization, x-client-info, apikey",
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🔐 Authentication: JWT with admin role OR shared secret fallback
  let isAuthorized = false;
  let authMethod = "";

  // Try JWT-based admin auth first
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const authResult = await verifyAuth(req);
    
    if (authResult.authenticated && authResult.userId) {
      const roleResult = await requireRole(authResult.userId, "admin");
      
      if (roleResult.authorized) {
        isAuthorized = true;
        authMethod = "jwt_admin";
        console.log(`[admin-payouts] Authorized via JWT for admin user: ${authResult.userId}`);
      } else {
        // User is authenticated but not an admin
        return createForbiddenResponse(
          roleResult.error || "Admin access required",
          corsHeaders
        );
      }
    }
  }

  // Fallback: shared secret for automated systems (e.g., cron jobs)
  if (!isAuthorized) {
    const secretHeader = req.headers.get("x-admin-secret");
    if (secretHeader && secretHeader === adminSecret) {
      isAuthorized = true;
      authMethod = "shared_secret";
      console.log("[admin-payouts] Authorized via shared secret");
    }
  }

  if (!isAuthorized) {
    return createUnauthorizedResponse("Unauthorized", corsHeaders);
  }

  try {
    if (req.method === "GET") {
      // 🔎 List what vendors are owed (pending payouts)
      const { data, error } = await supabase
        .from("vendor_payouts")
        .select(
          `
          id,
          vendor_id,
          order_id,
          amount,
          platform_fee,
          status,
          created_at,
          paid_at,
          paid_reference,
          paid_by,
          vendor_profiles:vendor_id (
            business_name,
            contact_phone
          )
        `
        )
        .in("status", ["pending", "scheduled", "processing"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[admin-payouts] Fetch error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Group by vendor on the fly
      const byVendor: Record<
        string,
        {
          vendor_id: string;
          vendor_name: string | null;
          contact_phone: string | null;
          total_pending: number;
          payouts: PayoutRecord[];
        }
      > = {};

      for (const row of data ?? []) {
        const key = row.vendor_id;
        // Handle vendor_profiles which may be an array or single object from join
        const vendorProfile = Array.isArray(row.vendor_profiles) 
          ? row.vendor_profiles[0] as VendorProfile | undefined
          : row.vendor_profiles as VendorProfile | null;
        
        if (!byVendor[key]) {
          byVendor[key] = {
            vendor_id: row.vendor_id,
            vendor_name: vendorProfile?.business_name ?? null,
            contact_phone: vendorProfile?.contact_phone ?? null,
            total_pending: 0,
            payouts: [],
          };
        }
        byVendor[key].total_pending += Number(row.amount || 0);
        // Push with normalized vendor_profiles
        byVendor[key].payouts.push({
          ...row,
          vendor_profiles: vendorProfile ?? null,
        } as PayoutRecord);
      }

      const vendors = Object.values(byVendor);

      return new Response(JSON.stringify({ vendors, auth_method: authMethod }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      // ✅ Mark specific payouts as "paid" (simulate settlement)
      const body = await req.json().catch(() => ({}));
      const { payout_ids, vendor_id, mark_all_for_vendor, paid_by, note } = body;

      if ((!payout_ids || payout_ids.length === 0) && !mark_all_for_vendor) {
        return new Response(
          JSON.stringify({
            error:
              "Provide payout_ids[] or set mark_all_for_vendor=true with vendor_id",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Build the base filter: only pending-ish payouts
      let query = supabase
        .from("vendor_payouts")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paid_reference:
            note ||
            `MANUAL-PAYOUT-${new Date().toISOString().replace(/[:.]/g, "")}`,
          paid_by: paid_by || `admin-${authMethod}`,
        })
        .in("status", ["pending", "scheduled", "processing"]);

      if (payout_ids && payout_ids.length > 0) {
        query = query.in("id", payout_ids);
      } else if (mark_all_for_vendor && vendor_id) {
        query = query.eq("vendor_id", vendor_id);
      }

      const { data, error } = await query.select("id, vendor_id, amount, status");

      if (error) {
        console.error("[admin-payouts] Update error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          updated_count: data?.length ?? 0,
          updated: data,
          auth_method: authMethod,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[admin-payouts] Unexpected error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
