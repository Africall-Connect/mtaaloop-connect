// supabase/functions/admin-vendor-payouts/index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminSecret = Deno.env.get("ADMIN_PAYOUT_SECRET") ?? "change-me";

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Types
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

interface VendorSummary {
  vendor_id: string;
  vendor_name: string | null;
  contact_phone: string | null;
  total_pending: number;
  payouts: PayoutRecord[];
}

// Basic CORS helper
const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🔐 Simple shared-secret check (for now)
  const secretHeader = req.headers.get("x-admin-secret");
  if (!secretHeader || secretHeader !== adminSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method === "GET") {
      // 🔎 1) List what vendors are owed (pending payouts)
      // You can join vendor_profiles here if you want vendor name
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
        if (!byVendor[key]) {
          byVendor[key] = {
            vendor_id: row.vendor_id,
            vendor_name: row.vendor_profiles?.business_name ?? null,
            contact_phone: row.vendor_profiles?.contact_phone ?? null,
            total_pending: 0,
            payouts: [],
          };
        }
        byVendor[key].total_pending += Number(row.amount || 0);
        byVendor[key].payouts.push(row);
      }

      const vendors = Object.values(byVendor);

      return new Response(JSON.stringify({ vendors }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      // ✅ 2) Mark specific payouts as "paid" (simulate settlement)
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
          paid_by: paid_by || "admin-manual",
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
