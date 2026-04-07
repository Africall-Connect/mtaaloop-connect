import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Flag, MessageSquare, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { useCustomerSnapshot } from "@/hooks/useCustomerSnapshot";
import { findOrCreateChatWithCustomer } from "@/lib/csrChat";

interface Order {
  id: string;
  order_number: string | null;
  customer_id: string | null;
  vendor_id: string | null;
  total_amount: number | null;
  status: string | null;
  payment_status: string | null;
  delivery_address: string | null;
  full_name: string | null;
  user_email: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at?: string | null;
  estimated_delivery_time?: string | null;
  is_flagged?: boolean | null;
  flagged_reason?: string | null;
  flagged_at?: string | null;
  flagged_by?: string | null;
  csr_notes?: string | null;
}

const STUCK_HOURS = 4;
const LATE_MIN = 30;

interface VendorOption {
  user_id: string;
  business_name: string;
}

export default function CSROrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string>("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to fetch orders: " + error.message);
    } else {
      setOrders((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  const fetchVendors = useCallback(async () => {
    const { data } = await supabase
      .from("vendor_profiles")
      .select("user_id, business_name")
      .eq("is_approved", true)
      .not("user_id", "is", null)
      .order("business_name");
    setVendors(((data as any[]) || []).filter(v => !!v.user_id));
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, [fetchOrders, fetchVendors]);

  const isStuck = (o: Order) => {
    if (!o.updated_at || ["delivered", "cancelled"].includes(o.status || "")) return false;
    return Date.now() - new Date(o.updated_at).getTime() > STUCK_HOURS * 60 * 60 * 1000;
  };
  const isLate = (o: Order) => {
    if (!o.estimated_delivery_time || ["delivered", "cancelled"].includes(o.status || "")) return false;
    return Date.now() > new Date(o.estimated_delivery_time).getTime() + LATE_MIN * 60 * 1000;
  };

  const filtered = orders.filter(o => {
    if (vendorFilter !== "all" && o.vendor_id !== vendorFilter) return false;
    if (tab === "flagged" && !o.is_flagged) return false;
    if (tab === "stuck" && !isStuck(o)) return false;
    if (tab === "late" && !isLate(o)) return false;
    if (tab === "mine" && o.flagged_by !== user?.id) return false;
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

  const vendorNameById = (vendorId: string | null) => {
    if (!vendorId) return "—";
    const v = vendors.find(x => x.user_id === vendorId);
    return v?.business_name || vendorId.slice(0, 8);
  };

  const counts = {
    all: orders.length,
    flagged: orders.filter(o => o.is_flagged).length,
    stuck: orders.filter(isStuck).length,
    late: orders.filter(isLate).length,
    mine: orders.filter(o => o.flagged_by === user?.id).length,
  };

  const statusColor = (s: string | null) => {
    switch (s) {
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "out_for_delivery":
      case "in_transit": return "bg-blue-100 text-blue-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
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
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendors ({vendors.length})</SelectItem>
            {vendors.map(v => (
              <SelectItem key={v.user_id} value={v.user_id}>
                {v.business_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all" className="text-xs">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="flagged" className="text-xs">🚩 Flagged ({counts.flagged})</TabsTrigger>
          <TabsTrigger value="stuck" className="text-xs">⏱ Stuck ({counts.stuck})</TabsTrigger>
          <TabsTrigger value="late" className="text-xs">⚠ Late ({counts.late})</TabsTrigger>
          <TabsTrigger value="mine" className="text-xs">My flags ({counts.mine})</TabsTrigger>
        </TabsList>
      </Tabs>

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
                    <th className="text-left px-4 py-3"></th>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Vendor</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        {o.is_flagged && <Flag className="h-4 w-4 text-red-500" />}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{o.order_number || o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">{o.full_name || o.user_email || "—"}</td>
                      <td className="px-4 py-3 text-xs">{vendorNameById(o.vendor_id)}</td>
                      <td className="px-4 py-3 text-right font-medium">KSh {Number(o.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge className={statusColor(o.status)}>{o.status || "—"}</Badge></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order details</SheetTitle>
          </SheetHeader>
          {selected && <OrderDetail order={selected} onUpdate={() => { fetchOrders(); setSelected(null); }} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OrderDetail({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const { user } = useAuth();
  const snap = useCustomerSnapshot(order.customer_id || null);
  const [csrNotes, setCsrNotes] = useState(order.csr_notes || "");
  const [flagReason, setFlagReason] = useState(order.flagged_reason || "");
  const [escalationReason, setEscalationReason] = useState("");
  const [showFlag, setShowFlag] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [busy, setBusy] = useState(false);

  const saveNotes = async () => {
    setBusy(true);
    const { error } = await (supabase.from("orders") as any)
      .update({ csr_notes: csrNotes })
      .eq("id", order.id);
    if (error) toast.error("Save failed: " + error.message);
    else {
      toast.success("Notes saved");
      onUpdate();
    }
    setBusy(false);
  };

  const flagOrder = async () => {
    if (!flagReason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    setBusy(true);
    const { error } = await (supabase.from("orders") as any)
      .update({
        is_flagged: true,
        flagged_reason: flagReason.trim(),
        flagged_at: new Date().toISOString(),
        flagged_by: user?.id,
      })
      .eq("id", order.id);
    if (error) toast.error("Flag failed: " + error.message);
    else {
      toast.success("Order flagged");
      onUpdate();
    }
    setBusy(false);
  };

  const unflagOrder = async () => {
    setBusy(true);
    const { error } = await (supabase.from("orders") as any)
      .update({
        is_flagged: false,
        flagged_reason: null,
        flagged_at: null,
        flagged_by: null,
      })
      .eq("id", order.id);
    if (error) toast.error("Unflag failed: " + error.message);
    else {
      toast.success("Flag removed");
      onUpdate();
    }
    setBusy(false);
  };

  const escalateToAdmin = async () => {
    if (!escalationReason.trim() || !order.customer_id) {
      toast.error("Please enter a reason");
      return;
    }
    setBusy(true);
    const { error } = await (supabase.from("support_tickets") as any).insert({
      customer_id: order.customer_id,
      order_id: order.id,
      subject: `Order issue: ${order.order_number || order.id.slice(0, 8)}`,
      description: escalationReason.trim(),
      category: "order_issue",
      severity: "high",
      status: "escalated",
      escalated_to_admin: true,
      escalation_reason: escalationReason.trim(),
    });
    if (error) toast.error("Escalation failed: " + error.message);
    else {
      toast.success("Escalated to admin");
      onUpdate();
    }
    setBusy(false);
  };

  const startChat = async () => {
    if (!user || !order.customer_id) return;
    setBusy(true);
    try {
      const chatId = await findOrCreateChatWithCustomer(user.id, order.customer_id);
      toast.success("Chat opened");
      window.location.href = `/csr/inbox?chat=${chatId}`;
    } catch (e: any) {
      toast.error("Failed: " + (e?.message || "Unknown error"));
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Order summary */}
      <Card className="p-3">
        <div className="text-xs text-slate-500">Order #</div>
        <div className="font-mono font-semibold">{order.order_number || order.id}</div>
        <div className="text-xs text-slate-500 mt-2">Total</div>
        <div className="font-semibold">KSh {Number(order.total_amount || 0).toLocaleString()}</div>
        <div className="text-xs text-slate-500 mt-2">Status</div>
        <Badge>{order.status}</Badge>
        {order.delivery_address && (
          <>
            <div className="text-xs text-slate-500 mt-2">Delivery address</div>
            <div className="text-sm">{order.delivery_address}</div>
          </>
        )}
        {order.is_flagged && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded">
            <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-semibold text-xs">
              <Flag className="h-3 w-3" /> Flagged
            </div>
            {order.flagged_reason && <div className="text-xs text-red-600 mt-1">{order.flagged_reason}</div>}
          </div>
        )}
      </Card>

      {/* Customer mini snapshot */}
      <Card className="p-3">
        <div className="text-xs text-slate-500 mb-1">Customer</div>
        <div className="font-semibold text-sm">
          {snap.loading
            ? "Loading…"
            : snap.profile?.name || order.full_name || snap.profile?.email || "Unnamed customer"}
        </div>
        {!snap.loading && snap.profile?.email && (
          <div className="text-xs text-slate-500">{snap.profile.email}</div>
        )}
        {snap.wallet && !snap.loading && (
          <div className="text-xs mt-1">Wallet: <strong>KSh {snap.wallet.balance.toLocaleString()}</strong></div>
        )}
      </Card>

      {/* CSR notes */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">CSR Notes (internal)</div>
        <Textarea
          value={csrNotes}
          onChange={(e) => setCsrNotes(e.target.value)}
          placeholder="Add notes only visible to support staff..."
          rows={3}
        />
        <Button size="sm" variant="outline" className="mt-2" onClick={saveNotes} disabled={busy}>
          <Save className="h-3 w-3 mr-2" /> Save notes
        </Button>
      </div>

      {/* Actions */}
      <div className="space-y-2 border-t pt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Actions</div>
        <div className="grid grid-cols-2 gap-2">
          {order.is_flagged ? (
            <Button size="sm" variant="outline" onClick={unflagOrder} disabled={busy}>
              <Flag className="h-3 w-3 mr-1" /> Unflag
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowFlag(true)} disabled={busy}>
              <Flag className="h-3 w-3 mr-1" /> Flag
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={startChat} disabled={busy}>
            <MessageSquare className="h-3 w-3 mr-1" /> Open chat
          </Button>
          <Button size="sm" variant="destructive" className="col-span-2" onClick={() => setShowEscalate(true)} disabled={busy}>
            <AlertTriangle className="h-3 w-3 mr-1" /> Escalate to admin
          </Button>
        </div>

        {showFlag && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded space-y-2">
            <div className="text-xs font-semibold">Flag reason</div>
            <Textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Why are you flagging this order?"
              rows={3}
              className="text-xs bg-white"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={flagOrder} disabled={busy}>Save flag</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowFlag(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {showEscalate && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded space-y-2">
            <div className="text-xs font-semibold text-red-700">Escalation reason</div>
            <Textarea
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Why does an admin need to handle this?"
              rows={3}
              className="text-xs bg-white"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={escalateToAdmin} disabled={busy || !escalationReason.trim()}>Confirm escalation</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowEscalate(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
