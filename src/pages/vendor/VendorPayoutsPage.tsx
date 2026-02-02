import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type VendorPayout = {
  id: string;
  order_id: string | null;
  amount: number;
  platform_fee: number;
  status: "pending" | "scheduled" | "processing" | "paid" | "failed" | "canceled";
  created_at: string;
};

export default function VendorPayoutsPage() {
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchVendorAndPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchVendorAndPayouts = async () => {
    try {
      setIsLoading(true);

      // 1) Find the vendor_profile for this logged-in user
      const { data: vendorProfile, error: vendorError } = await supabase
        .from("vendor_profiles")
        .select("id, business_name")
        .eq("user_id", user!.id)
        .single();

      if (vendorError) {
        console.error("Error loading vendor profile:", vendorError);
        toast.error("Could not load vendor profile.");
        setIsLoading(false);
        return;
      }

      if (!vendorProfile) {
        toast.error("No vendor profile found for this account.");
        setIsLoading(false);
        return;
      }

      setVendorId(vendorProfile.id);

      // 2) Load payouts for this vendor
      const { data: payoutData, error: payoutsError } = await supabase
        .from("vendor_payouts")
        .select("id, order_id, amount, platform_fee, status, created_at")
        .eq("vendor_id", vendorProfile.id)
        .order("created_at", { ascending: false });

      if (payoutsError) {
        console.error("Error loading payouts:", payoutsError);
        toast.error("Could not load payouts.");
        setIsLoading(false);
        return;
      }

      setPayouts((payoutData || []) as VendorPayout[]);
    } catch (error) {
      console.error("Unexpected error loading payouts:", error);
      toast.error("Something went wrong while loading payouts.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVendorAndPayouts();
  };

  const totals = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let failed = 0;

    for (const p of payouts) {
      if (p.status === "pending" || p.status === "scheduled" || p.status === "processing") {
        pending += Number(p.amount);
      } else if (p.status === "paid") {
        paid += Number(p.amount);
      } else if (p.status === "failed" || p.status === "canceled") {
        failed += Number(p.amount);
      }
    }

    return { pending, paid, failed };
  }, [payouts]);

  const getStatusBadge = (status: VendorPayout["status"]) => {
    switch (status) {
      case "pending":
      case "scheduled":
      case "processing":
        return <Badge className="bg-yellow-500 text-white text-xs">Pending</Badge>;
      case "paid":
        return <Badge className="bg-green-600 text-white text-xs">Paid</Badge>;
      case "failed":
      case "canceled":
        return <Badge className="bg-red-500 text-white text-xs">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white text-xs">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">
            You must be logged in as a vendor to view payouts.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading && !isRefreshing) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading payouts...</span>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-5xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Vendor Payouts</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track earnings and pending settlements.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} size="sm" className="shrink-0 self-start sm:self-auto">
          {isRefreshing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Summary cards - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Pending Payouts</div>
          <div className="text-xl sm:text-2xl font-bold">KSh {totals.pending.toLocaleString()}</div>
          <div className="text-xs text-yellow-600 mt-1">
            Not yet disbursed
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Paid Out</div>
          <div className="text-xl sm:text-2xl font-bold">KSh {totals.paid.toLocaleString()}</div>
          <div className="text-xs text-green-700 mt-1">
            Successfully settled
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Failed / Canceled</div>
          <div className="text-xl sm:text-2xl font-bold">KSh {totals.failed.toLocaleString()}</div>
          <div className="text-xs text-red-600 mt-1">
            Did not go through
          </div>
        </Card>
      </div>

      {/* Payouts table/list */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold">Payout History</h2>
          <span className="text-xs text-muted-foreground">
            {payouts.length} record{payouts.length === 1 ? "" : "s"}
          </span>
        </div>

        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-xs sm:text-sm min-w-[400px]">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 px-2 text-left">Date</th>
                  <th className="py-2 px-2 text-left">Order</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-right hidden sm:table-cell">Fee</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 px-2 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2">
                      {p.order_id ? (
                        <span className="font-mono text-xs">
                          #{p.order_id.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      KSh {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      KSh {Number(p.platform_fee).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {getStatusBadge(p.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
