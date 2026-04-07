// src/pages/admin/AdminVendorPayouts.tsx
import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PayoutRow {
  id: string;
  vendor_id: string;
  status: string;
  // Schema variants — pick whichever exists
  amount?: number | null;
  net_amount?: number | null;
  platform_fee?: number | null;
  order_id?: string | null;
  payout_reference?: string | null;
  created_at: string;
}

interface VendorSummary {
  vendor_id: string;
  vendor_name: string | null;
  contact_phone: string | null;
  total_pending: number;
  payouts: PayoutRow[];
}

const PENDING_STATUSES = ["pending", "scheduled", "processing"];

const AdminVendorPayouts = () => {
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingVendor, setProcessingVendor] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      // Query vendor_payouts directly — admin has full RLS access
      const { data: payouts, error } = await (supabase.from("vendor_payouts") as any)
        .select("*")
        .in("status", PENDING_STATUSES)
        .order("created_at", { ascending: true });

      if (error) {
        // Table might not exist or no permissions — fail gracefully
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setVendors([]);
          return;
        }
        throw new Error(error.message);
      }

      const rows = (payouts as PayoutRow[]) || [];

      // Fetch vendor names in a single query for the unique vendor IDs
      const vendorIds = Array.from(new Set(rows.map(r => r.vendor_id).filter(Boolean)));
      let vendorMap: Record<string, { business_name: string | null; contact_phone: string | null }> = {};

      if (vendorIds.length > 0) {
        const { data: vendorData } = await (supabase.from("vendor_profiles") as any)
          .select("id, business_name, contact_phone")
          .in("id", vendorIds);
        if (vendorData) {
          vendorMap = (vendorData as any[]).reduce((acc, v) => {
            acc[v.id] = { business_name: v.business_name, contact_phone: v.contact_phone };
            return acc;
          }, {} as typeof vendorMap);
        }
      }

      // Group by vendor
      const byVendor: Record<string, VendorSummary> = {};
      for (const row of rows) {
        const key = row.vendor_id;
        if (!key) continue;
        if (!byVendor[key]) {
          byVendor[key] = {
            vendor_id: key,
            vendor_name: vendorMap[key]?.business_name ?? null,
            contact_phone: vendorMap[key]?.contact_phone ?? null,
            total_pending: 0,
            payouts: [],
          };
        }
        const amt = Number(row.net_amount ?? row.amount ?? 0);
        byVendor[key].total_pending += amt;
        byVendor[key].payouts.push(row);
      }

      setVendors(Object.values(byVendor));
    } catch (error: unknown) {
      console.error("Error fetching payouts", error);
      toast.error((error as Error).message || "Failed to load payouts");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkVendorPaid = async (vendor: VendorSummary) => {
    if (!confirm(`Mark KSh ${vendor.total_pending.toLocaleString()} as paid for this vendor?`)) {
      return;
    }

    setProcessingVendor(vendor.vendor_id);
    try {
      const { data, error } = await (supabase.from("vendor_payouts") as any)
        .update({
          status: "completed",
          payout_date: new Date().toISOString(),
        })
        .eq("vendor_id", vendor.vendor_id)
        .in("status", PENDING_STATUSES)
        .select("id");

      if (error) throw new Error(error.message);

      toast.success(
        `Marked ${data?.length || 0} payout(s) as paid for ${vendor.vendor_name || "vendor"}`
      );

      await fetchPayouts();
    } catch (error: unknown) {
      console.error("Error marking payouts paid", error);
      toast.error((error as Error).message || "Failed to mark payouts as paid");
    } finally {
      setProcessingVendor(null);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendor Payouts</h1>
        <Button variant="outline" size="sm" onClick={fetchPayouts} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </span>
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        ⚠️ This screen <strong>does not actually move money</strong>. It records that you
        already paid the vendors manually (M-PESA, bank, cash, etc.) and updates the database
        so the payment flow is complete.
      </p>

      {vendors.length === 0 && !loading && (
        <Card className="p-6 text-center text-muted-foreground">
          No pending vendor payouts. 🎉
        </Card>
      )}

      <div className="space-y-4">
        {vendors.map((vendor) => (
          <Card key={vendor.vendor_id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">
                  {vendor.vendor_name || "Unnamed Vendor"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Vendor ID: {vendor.vendor_id}
                  {vendor.contact_phone && ` • ${vendor.contact_phone}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Pending</div>
                <div className="text-xl font-bold text-primary">
                  KSh {vendor.total_pending.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t mt-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {vendor.payouts.length} payout(s)
                </Badge>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleMarkVendorPaid(vendor)}
                disabled={processingVendor === vendor.vendor_id}
              >
                {processingVendor === vendor.vendor_id ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Marking as Paid…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark All As Paid
                  </span>
                )}
              </Button>
            </div>

            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                View payout breakdown
              </summary>
              <div className="mt-2 text-xs space-y-1">
                {vendor.payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between border-b last:border-0 py-1"
                  >
                    <span>
                      {payout.payout_reference || payout.order_id || payout.id.slice(0, 8)}
                      <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                        {payout.status}
                      </span>
                    </span>
                    <span>
                      KSh {Number(payout.net_amount ?? payout.amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminVendorPayouts;
