import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Clock, Ticket, CheckCircle2, AlertTriangle, ArrowRight,
} from "lucide-react";

interface Stats {
  unassignedChats: number;
  myActiveChats: number;
  openTickets: number;
  myInProgressTickets: number;
  resolvedToday: number;
  escalatedTickets: number;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export default function CSRDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    unassignedChats: 0,
    myActiveChats: 0,
    openTickets: 0,
    myInProgressTickets: 0,
    resolvedToday: 0,
    escalatedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [queuePreview, setQueuePreview] = useState<any[]>([]);
  const [myTicketsPreview, setMyTicketsPreview] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        unassignedChats,
        myActiveChats,
        openTickets,
        myInProgress,
        resolvedToday,
        escalated,
        queueData,
        myTicketsData,
      ] = await Promise.all([
        (supabase.from("private_chats") as any).select("*", { count: "exact", head: true }).is("recipient_id", null).eq("is_closed", false),
        (supabase.from("private_chats") as any).select("*", { count: "exact", head: true }).eq("recipient_id", user.id).eq("is_closed", false),
        (supabase.from("support_tickets") as any).select("*", { count: "exact", head: true }).eq("status", "open"),
        (supabase.from("support_tickets") as any).select("*", { count: "exact", head: true }).eq("assigned_to", user.id).eq("status", "in_progress"),
        (supabase.from("support_tickets") as any).select("*", { count: "exact", head: true }).eq("assigned_to", user.id).eq("status", "resolved").gte("resolved_at", startOfToday()),
        (supabase.from("support_tickets") as any).select("*", { count: "exact", head: true }).eq("escalated_to_admin", true),
        (supabase.from("private_chats") as any).select("chat_id, initiator_id, created_at").is("recipient_id", null).eq("is_closed", false).order("created_at", { ascending: false }).limit(5),
        (supabase.from("support_tickets") as any).select("id, subject, severity, status, created_at, customer_id").eq("assigned_to", user.id).in("status", ["in_progress", "open"]).order("created_at", { ascending: false }).limit(5),
      ]);

      setStats({
        unassignedChats: unassignedChats.count || 0,
        myActiveChats: myActiveChats.count || 0,
        openTickets: openTickets.count || 0,
        myInProgressTickets: myInProgress.count || 0,
        resolvedToday: resolvedToday.count || 0,
        escalatedTickets: escalated.count || 0,
      });
      setQueuePreview((queueData.data as any[]) || []);
      setMyTicketsPreview((myTicketsData.data as any[]) || []);
    } catch (e) {
      console.error("CSR dashboard stats error", e);
    }
    setLoading(false);
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "low": return "bg-slate-100 text-slate-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Unassigned chats" value={stats.unassignedChats} color="amber" loading={loading} />
        <StatCard icon={MessageSquare} label="My active chats" value={stats.myActiveChats} color="blue" loading={loading} />
        <StatCard icon={Ticket} label="Open tickets" value={stats.openTickets} color="purple" loading={loading} />
        <StatCard icon={CheckCircle2} label="Resolved today" value={stats.resolvedToday} color="green" loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Ticket} label="My in-progress tickets" value={stats.myInProgressTickets} color="blue" loading={loading} />
        <StatCard icon={AlertTriangle} label="Escalated to admin" value={stats.escalatedTickets} color="red" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Queue preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pickup queue</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/csr/queue">Open queue <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Loading...</div>
            ) : queuePreview.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No customers waiting 🎉</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {queuePreview.map((c) => (
                  <div key={c.chat_id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-slate-500">{c.initiator_id?.slice(0, 8)}</div>
                      <div className="text-xs text-slate-500">Started {new Date(c.created_at).toLocaleTimeString()}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">Waiting</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My open tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My open tickets</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/csr/tickets">All tickets <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Loading...</div>
            ) : myTicketsPreview.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No tickets assigned to you</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myTicketsPreview.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{t.subject}</div>
                      <div className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</div>
                    </div>
                    <Badge className={severityColor(t.severity)}>{t.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  green: "from-emerald-500 to-emerald-600",
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  amber: "from-amber-500 to-amber-600",
  red: "from-red-500 to-red-600",
};

function StatCard({
  icon: Icon, label, value, color = "slate", loading = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-bold">
          {loading ? <span className="text-slate-300">...</span> : value}
        </div>
      </CardContent>
    </Card>
  );
}
