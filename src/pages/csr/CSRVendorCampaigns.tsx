import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Megaphone, Store, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  user_id: string | null;
  business_name: string;
  business_type: string | null;
}

interface Campaign {
  id: string;
  vendor_id: string;
  name: string;
  type: string;
  target_segment: string;
  message: string;
  status: string;
  scheduled_date: string | null;
  sent_count: number | null;
  open_rate: number | null;
  click_rate: number | null;
  created_at: string;
  created_by_csr: string | null;
}

const TYPES = ["email", "sms", "push"];
const SEGMENTS = ["all", "vip", "regular", "returning", "new"];

export default function CSRVendorCampaigns() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "push",
    target_segment: "all",
    message: "",
    scheduled_date: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoadingVendors(true);
    const { data, error } = await supabase
      .from("vendor_profiles")
      .select("id, user_id, business_name, business_type")
      .eq("is_approved", true)
      .not("user_id", "is", null)
      .order("business_name");
    if (error) {
      toast.error("Failed to load vendors: " + error.message);
    } else {
      // Drop any vendor without a user_id — campaign FK requires it
      setVendors(((data as Vendor[]) || []).filter(v => !!v.user_id));
    }
    setLoadingVendors(false);
  }, []);

  const fetchCampaigns = useCallback(async (vendor: Vendor) => {
    setLoadingCampaigns(true);
    const lookupId = vendor.user_id;
    if (!lookupId) {
      setCampaigns([]);
      setLoadingCampaigns(false);
      return;
    }
    const { data, error } = await (supabase.from("marketing_campaigns") as any)
      .select("*")
      .eq("vendor_id", lookupId)
      .order("created_at", { ascending: false });
    if (error) {
      // Table might not exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        setCampaigns([]);
        toast.info("Marketing campaigns table not yet provisioned for this vendor");
      } else {
        toast.error("Failed to load campaigns: " + error.message);
      }
    } else {
      setCampaigns((data as Campaign[]) || []);
    }
    setLoadingCampaigns(false);
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (selectedVendor) {
      fetchCampaigns(selectedVendor);
    }
  }, [selectedVendor, fetchCampaigns]);

  const filteredVendors = vendors.filter(v =>
    !vendorSearch || v.business_name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const createCampaign = async () => {
    if (!selectedVendor || !user) return;
    if (!selectedVendor.user_id) {
      toast.error("This vendor has no linked account, can't draft a campaign");
      return;
    }
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Name and message are required");
      return;
    }
    setSaving(true);
    const { error } = await (supabase.from("marketing_campaigns") as any).insert({
      vendor_id: selectedVendor.user_id,
      name: form.name.trim(),
      type: form.type,
      target_segment: form.target_segment,
      message: form.message.trim(),
      status: form.scheduled_date ? "scheduled" : "draft",
      scheduled_date: form.scheduled_date || null,
      sent_count: 0,
      open_rate: 0,
      click_rate: 0,
      created_by_csr: user.id,
    });
    if (error) {
      toast.error("Create failed: " + error.message);
    } else {
      toast.success(`Campaign drafted for ${selectedVendor.business_name}`);
      setDialogOpen(false);
      setForm({ name: "", type: "push", target_segment: "all", message: "", scheduled_date: "" });
      fetchCampaigns(selectedVendor);
    }
    setSaving(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "sent": return "bg-green-100 text-green-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="p-4 md:p-6 grid lg:grid-cols-3 gap-4 h-[calc(100vh-3.5rem)]">
      {/* Vendor picker */}
      <Card className="lg:col-span-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Store className="h-4 w-4" /> Pick a vendor
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              value={vendorSearch}
              onChange={e => setVendorSearch(e.target.value)}
              placeholder="Search vendors..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingVendors ? (
            <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No vendors</div>
          ) : (
            filteredVendors.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVendor(v)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                  selectedVendor?.id === v.id ? "bg-emerald-50 dark:bg-emerald-950/20" : ""
                }`}
              >
                <div className="font-medium text-sm truncate">{v.business_name}</div>
                <div className="text-xs text-slate-500">{v.business_type || "—"}</div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Campaigns */}
      <div className="lg:col-span-2 flex flex-col overflow-hidden">
        {!selectedVendor ? (
          <Card className="flex-1">
            <CardContent className="p-12 text-center text-slate-500">
              <Megaphone className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <h3 className="font-semibold mb-1">Pick a vendor on the left</h3>
              <p className="text-sm">Then draft marketing campaigns on their behalf.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">{selectedVendor.business_name}</h2>
                <p className="text-xs text-slate-500">{campaigns.length} campaign(s)</p>
              </div>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New campaign
              </Button>
            </div>

            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-0 h-full overflow-y-auto">
                {loadingCampaigns ? (
                  <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : campaigns.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No campaigns yet. Click "New campaign" to draft one.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {campaigns.map(c => (
                      <div key={c.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{c.name}</span>
                              {c.created_by_csr && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Sparkles className="h-2.5 w-2.5" /> Drafted by CSR
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-2">{c.message}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                              <Badge variant="outline" className="text-[10px]">{c.target_segment}</Badge>
                              <Badge className={`${statusColor(c.status)} text-[10px]`}>{c.status}</Badge>
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* New campaign dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New campaign for {selectedVendor?.business_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Weekend special"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target segment</Label>
                <Select value={form.target_segment} onValueChange={v => setForm(f => ({ ...f, target_segment: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={4}
                placeholder="Hey VIPs! Get 20% off this weekend..."
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_date}
                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
              />
            </div>
            <div className="text-xs text-slate-500 bg-muted/30 p-2 rounded">
              This campaign will be saved under <strong>{selectedVendor?.business_name}</strong>'s account
              with a "Drafted by CSR" audit tag. The vendor can review and edit it from their own dashboard.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createCampaign} disabled={saving}>
              {saving ? "Saving..." : "Save draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
