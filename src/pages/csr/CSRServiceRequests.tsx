import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RefreshCw, Clock, User, MapPin, Phone, MessageSquare, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_TYPE_META, ServiceType } from "@/types/subscription";

interface ServiceRequest {
  id: string;
  user_id: string;
  service_id?: string | null;
  service_name?: string | null;
  service_type: string;
  status: string;
  created_at: string;
  description: string | null;
  channel_preference: string | null;
  errand_type: string | null;
  location_scope: string | null;
  urgency: string | null;
  contact_number: string | null;
  house_number?: string | null;
  amount?: number | null;
  assigned_to: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  agent_notes: string | null;
}

interface AgentOption {
  id: string;
  label: string;
}

const STATUSES = ["pending", "assigned", "in_progress", "completed", "all"];

const statusColor = (s: string) => {
  switch (s) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "assigned": return "bg-blue-100 text-blue-800";
    case "in_progress": return "bg-purple-100 text-purple-800";
    case "completed": return "bg-green-100 text-green-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-slate-100 text-slate-800";
  }
};

const urgencyColor = (u: string | null) => {
  switch (u) {
    case "right_now": return "bg-red-100 text-red-800";
    case "within_hour": return "bg-orange-100 text-orange-800";
    case "later_today": return "bg-yellow-100 text-yellow-800";
    case "schedule": return "bg-blue-100 text-blue-800";
    default: return "bg-slate-100 text-slate-800";
  }
};

const getServiceDisplayName = (serviceType: string | null, serviceName?: string | null): string => {
  if (serviceType && SERVICE_TYPE_META[serviceType as ServiceType]) {
    return SERVICE_TYPE_META[serviceType as ServiceType].displayName;
  }
  return serviceName || serviceType || "Service request";
};

export default function CSRServiceRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState<ServiceRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("service_requests") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to load: " + error.message);
    } else {
      setRequests((data as ServiceRequest[]) || []);
    }
    setLoading(false);
  }, []);

  const fetchAgents = useCallback(async () => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "agent");

    if (!roleData || roleData.length === 0) {
      setAgents([]);
      return;
    }

    const userIds = roleData.map(r => r.user_id);
    try {
      const { data: users } = await (supabase.rpc as any)("get_user_details_by_id", { user_ids: userIds });
      if (users) {
        setAgents(((users as any[]) || []).map((u: any) => ({
          id: u.id,
          label: u.raw_user_meta_data?.full_name || u.email || u.id.slice(0, 8),
        })));
      }
    } catch {
      // RPC may not be available — fall back to bare ids
      setAgents(userIds.map(id => ({ id, label: id.slice(0, 8) })));
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchAgents();

    const channel = supabase
      .channel("csr-service-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => fetchRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, fetchAgents]);

  const assignAgent = async (requestId: string, agentId: string) => {
    const { error } = await (supabase.from("service_requests") as any)
      .update({
        assigned_to: agentId,
        assigned_at: new Date().toISOString(),
        status: "assigned",
      })
      .eq("id", requestId);
    if (error) {
      toast.error("Failed to assign: " + error.message);
    } else {
      toast.success("Agent assigned");
      fetchRequests();
    }
  };

  const updateStatus = async (requestId: string, status: string) => {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    const { error } = await (supabase.from("service_requests") as any)
      .update(updates)
      .eq("id", requestId);
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success(`Status: ${status}`);
      fetchRequests();
    }
  };

  const filtered = requests.filter(r => {
    if (tab === "all") return true;
    return r.status === tab;
  });

  const counts = {
    pending: requests.filter(r => r.status === "pending").length,
    assigned: requests.filter(r => r.status === "assigned").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    completed: requests.filter(r => r.status === "completed").length,
    all: requests.length,
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service requests</h2>
          <p className="text-sm text-slate-500">Triage incoming requests and assign them to field agents</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          {STATUSES.map(s => (
            <TabsTrigger key={s} value={s} className="capitalize text-xs">
              {s.replace(/_/g, " ")} ({counts[s as keyof typeof counts]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <Card><CardContent className="p-8 text-center text-slate-500">Loading service requests...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No requests here</h3>
            <p className="text-sm text-slate-500">
              {tab === "pending" ? "When customers file service requests, they'll appear here for you to assign." : "Nothing in this tab right now."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(req => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{getServiceDisplayName(req.service_type, req.service_name)}</span>
                      <Badge className={`${statusColor(req.status)} text-[10px]`}>{req.status.replace(/_/g, " ")}</Badge>
                      {req.urgency && (
                        <Badge className={`${urgencyColor(req.urgency)} text-[10px]`}>
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          {req.urgency.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-1">{req.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <User className="h-3 w-3" /> {req.user_id.slice(0, 8)}…
                      </span>
                      {req.house_number && <span>House: {req.house_number}</span>}
                      {req.location_scope && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {req.location_scope.replace(/_/g, " ")}
                        </span>
                      )}
                      {req.contact_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {req.contact_number}
                        </span>
                      )}
                      <span>{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                    {req.assigned_to && (
                      <div className="text-xs text-slate-500 mt-2">
                        <span className="font-mono">Assigned to: {agents.find(a => a.id === req.assigned_to)?.label || req.assigned_to.slice(0, 8)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:w-56 shrink-0">
                    {req.status === "pending" || req.status === "assigned" ? (
                      <Select onValueChange={(v) => assignAgent(req.id, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={req.assigned_to ? "Reassign agent" : "Assign agent"} />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-slate-500">No agents available</div>
                          ) : (
                            agents.map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : null}

                    {req.status === "assigned" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, "in_progress")}>
                        Mark in progress
                      </Button>
                    )}
                    {req.status === "in_progress" && (
                      <Button size="sm" onClick={() => updateStatus(req.id, "completed")}>
                        Mark completed
                      </Button>
                    )}
                    {req.status !== "completed" && req.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(req.id, "cancelled")}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
