import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Search, Edit, Store, Loader2, Clock, Eye, Download, Plus, Send, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { MAIN_CATEGORIES } from '@/constants/categories';
import { ApplicationDetailsDialog } from '@/components/admin/ApplicationDetailsDialog';
import { signUpAsAdmin, generateTempPassword } from '@/lib/adminAuth';
import { isVendorCurrentlyOpen } from '@/lib/vendorHours';

interface VendorProfile {
  id: string;
  user_id: string | null;
  business_name: string;
  business_type: string;
  business_description: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  estate_id: string | null;
  is_approved: boolean;
  is_active: boolean;
  is_open: boolean;
  slug: string | null;
  open_hours: string | null;
  tagline: string | null;
  delivery_time: string | null;
  delivery_fee: number | null;
  logo_url: string | null;
  rating: number;
  review_count: number;
  created_at: string;
  estates?: { name: string } | null;
}

export default function AdminVendorManagement() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [editVendor, setEditVendor] = useState<VendorProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<VendorProfile>>({});
  const [saving, setSaving] = useState(false);
  const [viewVendor, setViewVendor] = useState<VendorProfile | null>(null);

  // Add vendor (business-only) dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    business_name: "",
    business_type: "",
    business_phone: "",
    business_email: "",
    business_address: "",
    business_description: "",
  });

  // Invite credentials dialog
  const [inviteVendor, setInviteVendor] = useState<VendorProfile | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: "", password: "" });
  const [inviting, setInviting] = useState(false);

  // Credentials reveal dialog (one-time copy)
  const [credentials, setCredentials] = useState<{ vendor: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const createVendor = async () => {
    if (!addForm.business_name.trim() || !addForm.business_type || !addForm.business_phone.trim()) {
      toast.error("Business name, type and phone are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("vendor_profiles").insert({
      business_name: addForm.business_name.trim(),
      business_type: addForm.business_type,
      business_phone: addForm.business_phone.trim(),
      business_email: addForm.business_email.trim() || null,
      business_address: addForm.business_address.trim() || null,
      business_description: addForm.business_description.trim() || null,
      slug: slugify(addForm.business_name),
      is_approved: true,
      is_active: true,
      user_id: null,
    } as any);
    if (error) {
      toast.error("Create failed: " + error.message);
    } else {
      toast.success(`${addForm.business_name} added — invite the owner from the actions menu`);
      setAddOpen(false);
      setAddForm({
        business_name: "",
        business_type: "",
        business_phone: "",
        business_email: "",
        business_address: "",
        business_description: "",
      });
      fetchVendors();
    }
    setSaving(false);
  };

  const openInvite = (vendor: VendorProfile) => {
    setInviteVendor(vendor);
    setInviteForm({
      email: vendor.business_email || "",
      password: generateTempPassword(),
    });
  };

  const sendInvite = async () => {
    if (!inviteVendor) return;
    if (!inviteForm.email.trim() || !inviteForm.password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    setInviting(true);
    try {
      const newUser = await signUpAsAdmin(
        inviteForm.email.trim(),
        inviteForm.password,
        { full_name: inviteVendor.business_name, phone: inviteVendor.business_phone }
      );

      // Link the auth user to the existing vendor profile
      const { error: linkError } = await supabase
        .from("vendor_profiles")
        .update({ user_id: newUser.id, business_email: inviteForm.email.trim() })
        .eq("id", inviteVendor.id);
      if (linkError) throw linkError;

      // Insert vendor role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: newUser.id, role: "vendor" });
      if (roleError) throw roleError;

      // Show one-time credentials dialog
      setCredentials({
        vendor: inviteVendor.business_name,
        email: inviteForm.email.trim(),
        password: inviteForm.password,
      });
      setInviteVendor(null);
      fetchVendors();
    } catch (e: any) {
      toast.error("Invite failed: " + (e?.message || "Unknown error"));
    }
    setInviting(false);
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = `MtaaLoop Vendor Login\n\nBusiness: ${credentials.vendor}\nEmail: ${credentials.email}\nTemporary password: ${credentials.password}\n\nLogin at: ${window.location.origin}/auth/login`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const downloadVendor = (vendor: VendorProfile) => {
    try {
      const blob = new Blob([JSON.stringify(vendor, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor-${vendor.business_name.replace(/\s+/g, '-')}-${vendor.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*, estates(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (vendor: VendorProfile) => {
    setEditVendor(vendor);
    setEditForm({
      business_name: vendor.business_name,
      business_type: vendor.business_type,
      business_description: vendor.business_description,
      business_phone: vendor.business_phone,
      business_email: vendor.business_email,
      business_address: vendor.business_address,
      is_approved: vendor.is_approved,
      is_active: vendor.is_active,
      slug: vendor.slug,
      open_hours: vendor.open_hours,
      tagline: vendor.tagline,
      delivery_time: vendor.delivery_time,
      delivery_fee: vendor.delivery_fee,
    });
  };

  const handleSave = async () => {
    if (!editVendor) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          business_name: editForm.business_name,
          business_type: editForm.business_type,
          business_description: editForm.business_description,
          business_phone: editForm.business_phone,
          business_email: editForm.business_email,
          business_address: editForm.business_address,
          is_approved: editForm.is_approved,
          is_active: editForm.is_active,
          slug: editForm.slug,
          open_hours: editForm.open_hours,
          tagline: editForm.tagline,
          delivery_time: editForm.delivery_time,
          delivery_fee: editForm.delivery_fee,
        })
        .eq('id', editVendor.id);

      if (error) throw error;
      toast.success(`${editForm.business_name} updated successfully`);
      setEditVendor(null);
      fetchVendors();
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor: ' + (error?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = vendors.filter(v => {
    const matchesSearch =
      v.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.business_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.business_email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'approved' && v.is_approved) ||
      (filterStatus === 'pending' && !v.is_approved);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Vendor Management</h1>
              <p className="text-sm text-muted-foreground">
                View, add, and invite vendors
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add vendor
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, type, or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v: 'all' | 'approved' | 'pending') => setFilterStatus(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({vendors.length})</SelectItem>
                  <SelectItem value="approved">Approved ({vendors.filter(v => v.is_approved).length})</SelectItem>
                  <SelectItem value="pending">Pending ({vendors.filter(v => !v.is_approved).length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Estate</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No vendors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(vendor => {
                      const currentlyOpen = isVendorCurrentlyOpen(vendor.open_hours, vendor.is_open);
                      return (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.business_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{vendor.business_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{vendor.business_phone}</TableCell>
                          <TableCell className="text-sm">
                            {vendor.estates?.name || '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-muted-foreground">{vendor.open_hours || 'Not set'}</span>
                              <Badge variant={currentlyOpen ? "default" : "secondary"} className={`text-[10px] w-fit ${currentlyOpen ? 'bg-emerald-600 text-white' : ''}`}>
                                {currentlyOpen ? 'Open Now' : 'Closed'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {!vendor.user_id ? (
                              <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Awaiting invite</Badge>
                            ) : vendor.is_approved ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Approved</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setViewVendor(vendor)} title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => downloadVendor(vendor)} title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(vendor)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!vendor.user_id && (
                                <Button variant="ghost" size="sm" onClick={() => openInvite(vendor)} title="Invite credentials">
                                  <Send className="h-4 w-4 text-emerald-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editVendor} onOpenChange={open => { if (!open) setEditVendor(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Edit Vendor: {editVendor?.business_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input
                value={editForm.business_name || ''}
                onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Business Type</Label>
              <Select
                value={editForm.business_type || ''}
                onValueChange={val => setEditForm(f => ({ ...f, business_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAIN_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.business_description || ''}
                onChange={e => setEditForm(f => ({ ...f, business_description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={editForm.business_phone || ''}
                  onChange={e => setEditForm(f => ({ ...f, business_phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editForm.business_email || ''}
                  onChange={e => setEditForm(f => ({ ...f, business_email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={editForm.business_address || ''}
                onChange={e => setEditForm(f => ({ ...f, business_address: e.target.value }))}
              />
            </div>

            <div>
              <Label>Slug (URL path)</Label>
              <Input
                value={editForm.slug || ''}
                onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. ilora-flowers"
              />
            </div>

            <div>
              <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Working Hours (e.g. 06:00-17:00)</Label>
              <Input
                value={editForm.open_hours || ''}
                onChange={e => setEditForm(f => ({ ...f, open_hours: e.target.value }))}
                placeholder="06:00-17:00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Format: HH:MM-HH:MM (24h). Customers will see "Open" or "Closed" based on this.
              </p>
            </div>

            <div>
              <Label>Tagline</Label>
              <Input
                value={editForm.tagline || ''}
                onChange={e => setEditForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Fresh flowers delivered to your door"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Delivery Time</Label>
                <Input
                  value={editForm.delivery_time || ''}
                  onChange={e => setEditForm(f => ({ ...f, delivery_time: e.target.value }))}
                  placeholder="15-30 min"
                />
              </div>
              <div>
                <Label>Delivery Fee (KES)</Label>
                <Input
                  type="number"
                  value={editForm.delivery_fee ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, delivery_fee: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">Approved</p>
                <p className="text-xs text-muted-foreground">Allow vendor to operate</p>
              </div>
              <Switch
                checked={editForm.is_approved || false}
                onCheckedChange={val => setEditForm(f => ({ ...f, is_approved: val }))}
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">Active</p>
                <p className="text-xs text-muted-foreground">Vendor visible to customers</p>
              </div>
              <Switch
                checked={editForm.is_active !== false}
                onCheckedChange={val => setEditForm(f => ({ ...f, is_active: val }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVendor(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplicationDetailsDialog
        open={!!viewVendor}
        onOpenChange={(o) => !o && setViewVendor(null)}
        title={viewVendor?.business_name || 'Vendor'}
        data={viewVendor}
        documentFields={['business_document_url', 'logo_url', 'cover_image_url']}
      />

      {/* Add Vendor (business-only) Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add new vendor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Create a business record now. You can invite the owner with credentials later from the vendor's row.
            </p>
            <div>
              <Label>Business name *</Label>
              <Input
                value={addForm.business_name}
                onChange={e => setAddForm(f => ({ ...f, business_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Business type *</Label>
              <Select
                value={addForm.business_type}
                onValueChange={v => setAddForm(f => ({ ...f, business_type: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                <SelectContent>
                  {MAIN_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone *</Label>
                <Input
                  value={addForm.business_phone}
                  onChange={e => setAddForm(f => ({ ...f, business_phone: e.target.value }))}
                  placeholder="+254..."
                />
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={addForm.business_email}
                  onChange={e => setAddForm(f => ({ ...f, business_email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Address (optional)</Label>
              <Input
                value={addForm.business_address}
                onChange={e => setAddForm(f => ({ ...f, business_address: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={addForm.business_description}
                onChange={e => setAddForm(f => ({ ...f, business_description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={createVendor} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Credentials Dialog */}
      <Dialog open={!!inviteVendor} onOpenChange={(o) => !o && setInviteVendor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" /> Invite {inviteVendor?.business_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Enter an email and an auto-generated password. The vendor will use these to log in for the first time.
            </p>
            <div>
              <Label>Owner email</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={inviteForm.password}
                  onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setInviteForm(f => ({ ...f, password: generateTempPassword() }))}
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteVendor(null)}>Cancel</Button>
            <Button onClick={sendInvite} disabled={inviting}>
              {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Reveal Dialog (one-time) */}
      <Dialog open={!!credentials} onOpenChange={(o) => !o && setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Check className="h-5 w-5" /> Vendor invited successfully
            </DialogTitle>
          </DialogHeader>
          {credentials && (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200">
                ⚠️ This is the only time you'll see this password. Copy it now and send it to the vendor via WhatsApp / SMS / email.
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 font-mono text-xs">
                <div><span className="text-muted-foreground">Business:</span> <strong>{credentials.vendor}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> <strong>{credentials.email}</strong></div>
                <div><span className="text-muted-foreground">Password:</span> <strong>{credentials.password}</strong></div>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Login URL: {window.location.origin}/auth/login
                </div>
              </div>
              <Button onClick={copyCredentials} className="w-full">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy all credentials"}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentials(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
