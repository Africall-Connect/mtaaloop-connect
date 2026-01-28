// src/pages/admin/AdminVendorPayouts.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";

interface VendorPayout {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  order_id: string;
}

interface VendorSummary {
  vendor_id: string;
  vendor_name: string | null;
  contact_phone: string | null;
  total_pending: number;
  payouts: VendorPayout[];
}

const ADMIN_PAYOUT_SECRET = import.meta.env.VITE_ADMIN_PAYOUT_SECRET;
const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const AdminVendorPayouts = () => {
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingVendor, setProcessingVendor] = useState<string | null>(null);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/admin-vendor-payouts`, {
        method: "GET",
        headers: {
          "x-admin-secret": ADMIN_PAYOUT_SECRET,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to load payouts (${res.status})`);
      }

      const data = (await res.json()) as { vendors: VendorSummary[] };
      setVendors(data.vendors || []);
    } catch (error: unknown) {
      console.error("Error fetching payouts", error);
      toast.error((error as Error).message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkVendorPaid = async (vendor: VendorSummary) => {
    if (!confirm(`Mark KSh ${vendor.total_pending} as paid for this vendor?`)) {
      return;
    }

    setProcessingVendor(vendor.vendor_id);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/admin-vendor-payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_PAYOUT_SECRET,
        },
        body: JSON.stringify({
          vendor_id: vendor.vendor_id,
          mark_all_for_vendor: true,
          paid_by: "admin-console",
          note: "Manual settlement via M-PESA / bank",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to mark payouts as paid (${res.status})`);
      }

      const data = await res.json();
      toast.success(
        `Marked ${data.updated_count} payout(s) as paid for ${vendor.vendor_name || vendor.vendor_id}`
      );

      // Refresh list
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
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendor Payouts (Simulation)</h1>
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
                      Order: {payout.order_id}
                      <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                        {payout.status}
                      </span>
                    </span>
                    <span>KSh {Number(payout.amount).toLocaleString()}</span>
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
