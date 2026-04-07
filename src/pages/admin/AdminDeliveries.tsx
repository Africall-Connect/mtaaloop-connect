import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCSV";

interface Delivery {
  id: string;
  order_id?: string | null;
  premium_order_id?: string | null;
  trash_collection_id?: string | null;
  rider_id: string | null;
  status: string | null;
  estate_id: string | null;
  delivery_fee?: number | null;
  created_at: string;
  type: "normal" | "premium" | "trash";
}

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "normal" | "premium" | "trash">("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [normal, premium, trash] = await Promise.all([
        supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("premium_deliveries").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("trash_deliveries").select("*").order("created_at", { ascending: false }).limit(200),
      ]);

      const all: Delivery[] = [
        ...((normal.data as any[]) || []).map(d => ({ ...d, type: "normal" as const })),
        ...((premium.data as any[]) || []).map(d => ({ ...d, type: "premium" as const })),
        ...((trash.data as any[]) || []).map(d => ({ ...d, type: "trash" as const })),
      ];
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDeliveries(all);
    } catch (e: any) {
      toast.error("Failed to fetch deliveries: " + e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = deliveries.filter(d => typeFilter === "all" || d.type === typeFilter);

  const updateDelivery = async (d: Delivery, updates: Partial<Delivery>) => {
    const table =
      d.type === "normal" ? "deliveries" : d.type === "premium" ? "premium_deliveries" : "trash_deliveries";
    const { error } = await (supabase.from(table) as any).update(updates).eq("id", d.id);
    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Delivery updated");
      fetchAll();
    }
  };

  const statusColor = (s: string | null) => {
    switch (s) {
      case "delivered":
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const typeColor = (t: string) => {
    switch (t) {
      case "premium": return "bg-purple-100 text-purple-800";
      case "trash": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex gap-3">
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            exportToCSV(
              filtered.map(d => ({
                type: d.type,
                status: d.status,
                rider_id: d.rider_id,
                fee: d.delivery_fee,
                created_at: d.created_at,
              })),
              "admin-deliveries"
            );
            toast.success("Exported");
          }}
        >
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({deliveries.length})</TabsTrigger>
          <TabsTrigger value="normal">Normal ({deliveries.filter(d => d.type === "normal").length})</TabsTrigger>
          <TabsTrigger value="premium">Premium ({deliveries.filter(d => d.type === "premium").length})</TabsTrigger>
          <TabsTrigger value="trash">Trash ({deliveries.filter(d => d.type === "trash").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading deliveries...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No deliveries found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Rider</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Fee</th>
                    <th className="text-left px-4 py-3">Created</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={`${d.type}-${d.id}`} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-4 py-3"><Badge className={typeColor(d.type)}>{d.type}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs">{(d.order_id || d.premium_order_id || d.trash_collection_id || "").slice(0, 8)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{d.rider_id ? d.rider_id.slice(0, 8) : "—"}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(d.status)}>{d.status}</Badge></td>
                      <td className="px-4 py-3 text-right">KSh {Number(d.delivery_fee || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => updateDelivery(d, { status: "delivered" })}>Complete</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateDelivery(d, { status: "cancelled" })}>Cancel</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
