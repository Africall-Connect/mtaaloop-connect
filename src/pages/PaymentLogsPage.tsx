import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the structure of a single payment log object to ensure type safety.
interface PaymentLog {
  id: string;
  order_id: string;
  provider: string;
  event_type: string;
  status: string;
  reference: string | null;
  amount: number | null;
  created_at: string;
}

const PaymentLogsPage = () => {
  // --- STATE MANAGEMENT ---
  // `useState` hooks to manage the component's state.

  // Holds the array of payment logs fetched from the database.
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  // Stores the current value of the status filter dropdown. Default is "all".
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Tracks whether the data is currently being fetched to show loading indicators.
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  // Async function to fetch payment logs from the Supabase 'payment_logs' table.
  const fetchLogs = async () => {
    setLoading(true); // Set loading to true before starting the fetch.

    // Start building the Supabase query.
    let query = supabase
      .from("payment_logs")
      .select("id, order_id, provider, event_type, status, reference, amount, created_at")
      .order("created_at", { ascending: false }) // Order by most recent first.
      .limit(200); // Limit to the latest 200 logs to avoid fetching too much data.

    // If a specific status is selected in the filter, add a '.eq' clause to the query.
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Execute the query.
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching payment logs:", error);
    } else {
      // If fetch is successful, update the 'logs' state with the fetched data.
      setLogs(data ?? []);
    }
    setLoading(false); // Set loading to false once the fetch is complete.
  };

  // --- LIFECYCLE HOOK ---
  // `useEffect` hook to run side effects.
  // This will call `fetchLogs` automatically whenever the `statusFilter` state changes.
  // It also runs once on the initial component render.
  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  // --- RENDER ---
  // JSX to render the component's UI.
  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Logs</h1>
        {/* Filter and Refresh Controls */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchLogs} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* Table Headers */}
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">Time</th>
              <th className="text-left py-2 px-2">Order</th>
              <th className="text-left py-2 px-2">Provider</th>
              <th className="text-left py-2 px-2">Event</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-left py-2 px-2">Amount</th>
              <th className="text-left py-2 px-2">Reference</th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {/* Map over the 'logs' state array to render a row for each log. */}
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-muted/40">
                <td className="py-2 px-2">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="py-2 px-2 font-mono text-xs">{log.order_id}</td>
                <td className="py-2 px-2">{log.provider}</td>
                <td className="py-2 px-2">{log.event_type}</td>
                <td className="py-2 px-2">
                  {/* Conditional styling for the status badge. */}
                  <span
                    className={
                      log.status === "success"
                        ? "text-emerald-600"
                        : log.status === "failed"
                        ? "text-red-600"
                        : "text-amber-600"
                    }
                  >
                    {log.status}
                  </span>
                </td>
                <td className="py-2 px-2">
                  {log.amount != null ? `KSh ${Number(log.amount).toFixed(2)}` : "-"}
                </td>
                <td className="py-2 px-2 font-mono text-xs">
                  {log.reference || "-"}
                </td>
              </tr>
            ))}
            {/* Show a message if there are no logs to display. */}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-muted-foreground">
                  No payment logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default PaymentLogsPage;