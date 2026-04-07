import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, Check, X } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCSV";

interface Booking {
  id: string;
  customer_id: string | null;
  vendor_id: string | null;
  service_type_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
  amount: number | null;
  status: string | null;
  customer_notes: string | null;
  created_at: string;
}

const STATUSES = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booking_reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to fetch: " + error.message);
    } else {
      setBookings((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = bookings.filter(b => status === "all" || b.status === status);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await (supabase.from("booking_reservations") as any)
      .update({ status: newStatus })
      .eq("id", id);
    if (error) toast.error("Update failed: " + error.message);
    else {
      toast.success(`Booking ${newStatus}`);
      fetchBookings();
    }
  };

  const statusColor = (s: string | null) => {
    switch (s) {
      case "completed": return "bg-green-100 text-green-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex gap-3">
        <Button variant="outline" onClick={fetchBookings}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
        <Button variant="outline" onClick={() => { exportToCSV(filtered as any, "admin-bookings"); toast.success("Exported"); }}>
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="flex flex-wrap h-auto">
          {STATUSES.map(s => (
            <TabsTrigger key={s} value={s} className="capitalize text-xs">
              {s.replace(/_/g, " ")} ({bookings.filter(b => s === "all" || b.status === s).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No bookings found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-3">Booking</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Vendor</th>
                    <th className="text-left px-4 py-3">Date/Time</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-mono text-xs">{b.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{b.customer_id?.slice(0, 8) || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{b.vendor_id?.slice(0, 8) || "—"}</td>
                      <td className="px-4 py-3 text-xs">{b.booking_date} {b.booking_time}</td>
                      <td className="px-4 py-3 text-right">KSh {Number(b.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(b.status)}>{b.status}</Badge></td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "confirmed")}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "completed")}>Done</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(b.id, "cancelled")}>
                          <X className="h-3 w-3" />
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
    </div>
  );
}
