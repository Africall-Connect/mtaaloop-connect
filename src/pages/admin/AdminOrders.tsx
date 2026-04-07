import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Download, RefreshCw, Eye, X, Truck, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCSV";

interface Order {
  id: string;
  order_number: string | null;
  customer_id: string | null;
  vendor_id: string | null;
  total_amount: number | null;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  delivery_address: string | null;
  full_name: string | null;
  user_email: string | null;
  customer_notes: string | null;
  created_at: string;
}

const STATUSES = [
  "all",
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "in_transit",
  "delivered",
  "cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to fetch orders");
    } else {
      setOrders((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter(o => {
    if (status !== "all" && o.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.order_number?.toLowerCase().includes(q) ||
        o.full_name?.toLowerCase().includes(q) ||
        o.user_email?.toLowerCase().includes(q) ||
        o.delivery_address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase.from("orders").update(updates as any).eq("id", id);
    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Order updated");
      fetchOrders();
      setSelected(null);
    }
  };

  const statusColor = (s: string | null) => {
    switch (s) {
      case "delivered": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "out_for_delivery":
      case "in_transit": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by order #, customer, email, address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            exportToCSV(
              filtered.map(o => ({
                order_number: o.order_number,
                customer: o.full_name || o.user_email,
                total: o.total_amount,
                status: o.status,
                payment_status: o.payment_status,
                created_at: o.created_at,
              })),
              "admin-orders"
            );
            toast.success("Exported");
          }}
        >
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="flex flex-wrap h-auto">
          {STATUSES.map(s => (
            <TabsTrigger key={s} value={s} className="capitalize text-xs">
              {s.replace(/_/g, " ")} ({orders.filter(o => s === "all" || o.status === s).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Payment</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-mono text-xs">{o.order_number || o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">{o.full_name || o.user_email || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">KSh {Number(o.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusColor(o.status)}>{o.status || "—"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{o.payment_status || "—"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(o)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Order Number</div>
                <div className="font-mono font-semibold">{selected.order_number || selected.id}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Customer</div>
                <div>{selected.full_name || "—"}</div>
                <div className="text-xs text-slate-500">{selected.user_email}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Delivery Address</div>
                <div>{selected.delivery_address || "—"}</div>
              </div>
              {selected.customer_notes && (
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">Notes</div>
                  <div className="text-sm">{selected.customer_notes}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500">Total</div>
                  <div className="font-semibold">KSh {Number(selected.total_amount || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Payment</div>
                  <Badge variant="outline">{selected.payment_status}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Status</div>
                <Badge className={statusColor(selected.status)}>{selected.status}</Badge>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t space-y-2">
                <div className="text-sm font-semibold mb-2">Admin Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateOrder(selected.id, { status: "delivered" } as any)}>
                    <Truck className="h-4 w-4 mr-2" /> Mark Delivered
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateOrder(selected.id, { status: "cancelled" } as any)}>
                    <X className="h-4 w-4 mr-2" /> Cancel Order
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateOrder(selected.id, { payment_status: "refunded" } as any)}>
                    <DollarSign className="h-4 w-4 mr-2" /> Refund
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateOrder(selected.id, { payment_status: "paid" } as any)}>
                    <DollarSign className="h-4 w-4 mr-2" /> Mark Paid
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
