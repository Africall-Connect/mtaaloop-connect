import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Send, Users, Eye, Sparkles, RefreshCw, TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  audience_filter: any;
  title: string;
  message: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  last_sent_at: string | null;
  total_sent: number;
}

interface AudienceFilter {
  min_days_inactive: number | "";
  min_total_orders: number | "";
  max_total_orders: number | "";
}

const TYPES = [
  { value: "reminder", label: "Reminder" },
  { value: "re_engagement", label: "Win-back" },
  { value: "reorder", label: "Reorder nudge" },
  { value: "feedback", label: "Feedback request" },
  { value: "announcement", label: "Announcement" },
];

export default function CSRCampaigns() {
  const { user } = useAuth();
  const [tab, setTab] = useState("compose");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Compose form
  const [form, setForm] = useState({
    name: "",
    campaign_type: "reminder",
    title: "",
    message: "",
  });
  const [filter, setFilter] = useState<AudienceFilter>({
    min_days_inactive: 14,
    min_total_orders: "",
    max_total_orders: "",
  });
  const [previewIds, setPreviewIds] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("csr_outbound_campaigns") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load: " + error.message);
    } else {
      setCampaigns((data as Campaign[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const previewAudience = async () => {
    setPreviewing(true);
    try {
      // Build query from filter: pull customer_ids from orders
      let q = supabase.from("orders").select("customer_id, created_at").not("customer_id", "is", null);

      // Build aggregation client-side
      const { data, error } = await q.order("created_at", { ascending: false }).limit(2000);
      if (error) throw error;

      const byCustomer: Record<string, { count: number; lastAt: string }> = {};
      for (const row of (data as any[]) || []) {
        if (!row.customer_id) continue;
        if (!byCustomer[row.customer_id]) {
          byCustomer[row.customer_id] = { count: 0, lastAt: row.created_at };
        }
        byCustomer[row.customer_id].count++;
        if (row.created_at > byCustomer[row.customer_id].lastAt) {
          byCustomer[row.customer_id].lastAt = row.created_at;
        }
      }

      const now = Date.now();
      const matching = Object.entries(byCustomer).filter(([_, v]) => {
        const daysInactive = (now - new Date(v.lastAt).getTime()) / (1000 * 60 * 60 * 24);
        if (filter.min_days_inactive !== "" && daysInactive < Number(filter.min_days_inactive)) return false;
        if (filter.min_total_orders !== "" && v.count < Number(filter.min_total_orders)) return false;
        if (filter.max_total_orders !== "" && v.count > Number(filter.max_total_orders)) return false;
        return true;
      });

      setPreviewIds(matching.map(([id]) => id));
      toast.success(`Found ${matching.length} matching customer(s)`);
    } catch (e: any) {
      toast.error("Preview failed: " + e.message);
    }
    setPreviewing(false);
  };

  const sendCampaign = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.title.trim() || !form.message.trim()) {
      toast.error("Name, title and message are required");
      return;
    }
    if (previewIds.length === 0) {
      toast.error("Preview the audience first");
      return;
    }

    setSending(true);
    try {
      // 1. Create campaign row
      const { data: campaign, error: campaignError } = await (supabase.from("csr_outbound_campaigns") as any)
        .insert({
          name: form.name.trim(),
          campaign_type: form.campaign_type,
          audience_filter: filter,
          title: form.title.trim(),
          message: form.message.trim(),
          created_by: user.id,
          last_sent_at: new Date().toISOString(),
          total_sent: previewIds.length,
        })
        .select()
        .single();
      if (campaignError) throw campaignError;

      // 2. Send notification to each customer
      const notifications = previewIds.map(cid => ({
        user_id: cid,
        title: form.title.trim(),
        message: form.message.trim(),
        type: "csr_outreach",
      }));
      const { error: notifError } = await (supabase.from("notifications") as any).insert(notifications);
      if (notifError) throw notifError;

      // 3. Log campaign sends
      const sends = previewIds.map(cid => ({
        campaign_id: (campaign as any).id,
        customer_id: cid,
      }));
      await (supabase.from("csr_campaign_sends") as any).insert(sends);

      toast.success(`Campaign sent to ${previewIds.length} customers!`);
      setForm({ name: "", campaign_type: "reminder", title: "", message: "" });
      setPreviewIds([]);
      setTab("campaigns");
      fetchCampaigns();
    } catch (e: any) {
      toast.error("Send failed: " + e.message);
    }
    setSending(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reminders & campaigns</h2>
          <p className="text-sm text-slate-500">
            Bring inactive customers back with in-app notifications
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCampaigns}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="compose"><Plus className="h-3 w-3 mr-1" /> Compose & send</TabsTrigger>
          <TabsTrigger value="campaigns">My campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="performance"><TrendingUp className="h-3 w-3 mr-1" /> Performance</TabsTrigger>
        </TabsList>

        {/* COMPOSE & SEND */}
        <TabsContent value="compose" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Left: audience builder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" /> Step 1: Pick the audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Min days since last order</Label>
                  <Input
                    type="number"
                    value={filter.min_days_inactive}
                    onChange={e => setFilter(f => ({ ...f, min_days_inactive: e.target.value === "" ? "" : Number(e.target.value) }))}
                    placeholder="e.g. 14"
                  />
                  <p className="text-xs text-slate-500">Match customers whose last order was at least this many days ago</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Min total orders</Label>
                    <Input
                      type="number"
                      value={filter.min_total_orders}
                      onChange={e => setFilter(f => ({ ...f, min_total_orders: e.target.value === "" ? "" : Number(e.target.value) }))}
                      placeholder="optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max total orders</Label>
                    <Input
                      type="number"
                      value={filter.max_total_orders}
                      onChange={e => setFilter(f => ({ ...f, max_total_orders: e.target.value === "" ? "" : Number(e.target.value) }))}
                      placeholder="optional"
                    />
                  </div>
                </div>
                <Button onClick={previewAudience} disabled={previewing} className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  {previewing ? "Computing..." : "Preview audience"}
                </Button>
                {previewIds.length > 0 && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                      <Sparkles className="h-4 w-4" />
                      {previewIds.length} matching customers
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: compose */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="h-4 w-4" /> Step 2: Compose
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign name (internal)</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. 14-day win-back"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campaign type</Label>
                  <Select value={form.campaign_type} onValueChange={v => setForm(f => ({ ...f, campaign_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notification title</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. We miss you! 💚"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notification message</Label>
                  <Textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={4}
                    placeholder="Come back and order from your favourite vendors..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={sendCampaign}
            disabled={sending || previewIds.length === 0}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : `Send to ${previewIds.length} customers now`}
          </Button>
        </TabsContent>

        {/* MY CAMPAIGNS */}
        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No campaigns yet</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {campaigns.map(c => (
                    <div key={c.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{c.name}</div>
                          <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{c.message}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold">{c.total_sent}</div>
                          <div className="text-[10px] text-slate-500">sent</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">{c.campaign_type}</Badge>
                        {c.is_active && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">Active</Badge>}
                        <span className="text-[10px] text-slate-400">
                          {c.last_sent_at ? `Last sent ${new Date(c.last_sent_at).toLocaleDateString()}` : "Never sent"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4">
              <div className="text-xs text-slate-500">Total campaigns</div>
              <div className="text-2xl font-bold mt-1">{campaigns.length}</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-xs text-slate-500">Total notifications sent</div>
              <div className="text-2xl font-bold mt-1">{campaigns.reduce((s, c) => s + (c.total_sent || 0), 0)}</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-xs text-slate-500">Active campaigns</div>
              <div className="text-2xl font-bold mt-1">{campaigns.filter(c => c.is_active).length}</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-xs text-slate-500">Last 7 days</div>
              <div className="text-2xl font-bold mt-1">
                {campaigns.filter(c => c.last_sent_at && Date.now() - new Date(c.last_sent_at).getTime() < 7 * 24 * 60 * 60 * 1000).length}
              </div>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
