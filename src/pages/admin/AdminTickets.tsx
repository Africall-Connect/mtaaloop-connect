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
import { RefreshCw, Search, AlertTriangle, CheckCircle2, Clock, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { useCustomerSnapshot } from "@/hooks/useCustomerSnapshot";

interface Ticket {
  id: string;
  customer_id: string;
  order_id: string | null;
  subject: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  escalated_to_admin: boolean | null;
  escalation_reason: string | null;
  created_at: string;
  updated_at?: string;
}

interface Note {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

const STATUSES = ["escalated", "all", "open", "in_progress", "waiting_customer", "resolved"];

export default function AdminTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("escalated");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("support_tickets") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to fetch: " + error.message);
    } else {
      setTickets((data as Ticket[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => fetchTickets())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  const filtered = tickets.filter((t) => {
    if (filter === "escalated" && !t.escalated_to_admin) return false;
    if (filter !== "all" && filter !== "escalated" && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    escalated: tickets.filter((t) => t.escalated_to_admin).length,
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    waiting_customer: tickets.filter((t) => t.status === "waiting_customer").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "low": return "bg-slate-100 text-slate-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "resolved":
      case "closed": return "bg-green-100 text-green-800";
      case "escalated": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "waiting_customer": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Support Tickets
          </h2>
          <p className="text-sm text-slate-500">All tickets across the platform — escalated items need your attention</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTickets}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search subject or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex flex-wrap h-auto">
          {STATUSES.map((s) => {
            const count = counts[s as keyof typeof counts];
            const isEscalated = s === "escalated";
            return (
              <TabsTrigger key={s} value={s} className="capitalize text-xs">
                {isEscalated && <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />}
                {s.replace(/_/g, " ")} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No tickets here</h3>
              <p className="text-sm text-slate-500">
                {filter === "escalated" ? "No tickets have been escalated to admin yet." : "Tickets will appear here as customers file them."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {t.escalated_to_admin && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
                        <span className="font-semibold text-sm truncate">{t.subject}</span>
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">{t.description}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{t.category.replace(/_/g, " ")}</Badge>
                        <Badge className={`${severityColor(t.severity)} text-[10px]`}>{t.severity}</Badge>
                        <Badge className={`${statusColor(t.status)} text-[10px]`}>{t.status.replace(/_/g, " ")}</Badge>
                        <span className="text-[10px] text-slate-400">
                          <Clock className="h-3 w-3 inline mr-0.5" />
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                        {t.assigned_to && (
                          <span className="text-[10px] text-slate-400">
                            <User className="h-3 w-3 inline mr-0.5" />
                            assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.subject}</SheetTitle>
          </SheetHeader>
          {selected && <AdminTicketDetail ticket={selected} onUpdate={() => { fetchTickets(); setSelected(null); }} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AdminTicketDetail({ ticket, onUpdate }: { ticket: Ticket; onUpdate: () => void }) {
  const { user } = useAuth();
  const snap = useCustomerSnapshot(ticket.customer_id);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [ticket.id]);

  const fetchNotes = async () => {
    const { data } = await (supabase.from("support_ticket_notes") as any)
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setNotes((data as Note[]) || []);
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    setBusy(true);
    const { error } = await (supabase.from("support_ticket_notes") as any).insert({
      ticket_id: ticket.id,
      author_id: user.id,
      body: newNote.trim(),
    });
    if (error) {
      toast.error("Failed to add note: " + error.message);
    } else {
      toast.success("Note added");
      setNewNote("");
      fetchNotes();
    }
    setBusy(false);
  };

  const updateStatus = async (status: string, extras: Record<string, any> = {}) => {
    setBusy(true);
    const updates: any = { status, ...extras, updated_at: new Date().toISOString() };
    if (status === "resolved") {
      updates.resolved_at = new Date().toISOString();
      updates.escalated_to_admin = false;
    }
    if (status === "in_progress" && !ticket.assigned_to) {
      updates.assigned_to = user?.id;
      updates.assigned_at = new Date().toISOString();
    }
    const { error } = await (supabase.from("support_tickets") as any)
      .update(updates)
      .eq("id", ticket.id);
    if (error) {
      toast.error("Update failed: " + error.message);
      setBusy(false);
    } else {
      toast.success(`Ticket ${status}`);
      onUpdate();
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Customer mini card */}
      <Card className="p-3">
        <div className="text-xs text-slate-500 mb-1">Customer</div>
        <div className="font-semibold text-sm">
          {snap.loading ? "Loading…" : snap.profile?.name || snap.profile?.email || "Unnamed customer"}
        </div>
        {!snap.loading && snap.profile?.email && (
          <div className="text-xs text-slate-500">{snap.profile.email}</div>
        )}
        {snap.wallet && !snap.loading && (
          <div className="text-xs mt-1">Wallet: <strong>KSh {snap.wallet.balance.toLocaleString()}</strong></div>
        )}
      </Card>

      {/* Description */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Description</div>
        <div className="text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 rounded-lg whitespace-pre-wrap">
          {ticket.description}
        </div>
      </div>

      {/* Escalation banner */}
      {ticket.escalated_to_admin && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
          <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" /> Escalated to admin
          </div>
          {ticket.escalation_reason && (
            <div className="text-xs text-red-600 dark:text-red-300 mt-1">{ticket.escalation_reason}</div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-slate-500">Category</div>
          <div className="font-medium">{ticket.category.replace(/_/g, " ")}</div>
        </div>
        <div>
          <div className="text-slate-500">Severity</div>
          <div className="font-medium capitalize">{ticket.severity}</div>
        </div>
        <div>
          <div className="text-slate-500">Created</div>
          <div className="font-medium">{new Date(ticket.created_at).toLocaleString()}</div>
        </div>
        {ticket.order_id && (
          <div>
            <div className="text-slate-500">Order</div>
            <div className="font-mono text-[10px]">{ticket.order_id.slice(0, 8)}</div>
          </div>
        )}
      </div>

      {/* Internal notes */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Internal notes</div>
        {notes.length === 0 ? (
          <div className="text-xs text-slate-400 mb-2">No notes yet</div>
        ) : (
          <div className="space-y-2 mb-2">
            {notes.map((n) => (
              <div key={n.id} className="text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-2 rounded">
                <div className="whitespace-pre-wrap">{n.body}</div>
                <div className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add internal note (admin/CSR-only)"
          rows={2}
          className="text-xs"
        />
        <Button size="sm" variant="outline" className="mt-2" onClick={addNote} disabled={busy || !newNote.trim()}>
          <MessageSquare className="h-3 w-3 mr-2" /> Add note
        </Button>
      </div>

      {/* Actions */}
      <div className="space-y-2 border-t pt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Admin actions</div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => updateStatus("in_progress")} disabled={busy}>
            Mark in progress
          </Button>
          <Button size="sm" variant="outline" onClick={() => updateStatus("waiting_customer")} disabled={busy}>
            Waiting customer
          </Button>
          <Button size="sm" className="col-span-2" onClick={() => updateStatus("resolved")} disabled={busy}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve & clear escalation
          </Button>
        </div>
      </div>
    </div>
  );
}
