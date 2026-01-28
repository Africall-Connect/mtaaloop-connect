// src/pages/vendor/VendorStaffPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Users,
  Shield,
  Mail,
  Link as LinkIcon,
  Clock,
  PlusCircle,
} from 'lucide-react';
import StaffFormDialog from '@/components/vendor/staff/StaffFormDialog';

interface VendorProfile {
  id: string;
  business_name: string;
}

interface VendorStaff {
  id: string;
  staff_name: string | null;
  staff_email: string | null;
  is_active: boolean;
  created_at: string;
}

interface VendorStaffInvite {
  id: string;
  email: string | null;
  token: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function VendorStaffPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [staff, setStaff] = useState<VendorStaff[]>([]);
  const [invites, setInvites] = useState<VendorStaffInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) {
      loadVendorAndStaff();
    }
  }, [user, loadVendorAndStaff]);

  const loadVendorAndStaff = useCallback(async () => {
    try {
      // 1) get vendor_profile for logged in vendor
      const { data: vendorRow, error: vErr } = await supabase
        .from('vendor_profiles')
        .select('id, business_name')
        .eq('user_id', user?.id)
        .single();

      if (vErr) throw vErr;
      setVendor(vendorRow);

      // 2) get invites for this vendor
      const { data: inviteRows, error: iErr } = await supabase
        .from('vendor_staff_invites')
        .select('id, email, token, status, created_at, expires_at')
        .eq('vendor_id', vendorRow.id)
        .order('created_at', { ascending: false });

      if (iErr) throw iErr;
      setInvites(inviteRows || []);

      // 3) legacy staff (your old table) – keep for now
      const { data: staffRows, error: sErr } = await supabase
        .from('vendor_staff')
        .select('id, staff_name, staff_email, is_active, created_at')
        .eq('vendor_id', vendorRow.id)
        .order('created_at', { ascending: false });

      if (sErr) throw sErr;
      setStaff(staffRows || []);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleActive = async (row: VendorStaff) => {
    try {
      const { error } = await supabase
        .from('vendor_staff')
        .update({ is_active: !row.is_active })
        .eq('id', row.id);

      if (error) throw error;
      toast.success('Staff updated');
      loadVendorAndStaff();
    } catch (err: unknown) {
      toast.error('Failed to update staff', { description: (err as Error).message });
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      (s.staff_name || '').toLowerCase().includes(t) ||
      (s.staff_email || '').toLowerCase().includes(t)
    );
  });

  const pendingInvites = invites.filter((i) => i.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Staff & Team
                <Badge variant="secondary">
                  {filteredStaff.length} staff • {pendingInvites.length} invites
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage accounts that can log in for {vendor?.business_name}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* top stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staff (legacy)</p>
                <p className="text-3xl font-bold">{staff.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-3xl font-bold">{pendingInvites.length}</p>
              </div>
              <Mail className="h-10 w-10 text-amber-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active (legacy)</p>
                <p className="text-3xl font-bold">{staff.filter((s) => s.is_active).length}</p>
              </div>
              <Shield className="h-10 w-10 text-green-500" />
            </CardContent>
          </Card>
        </div>

        {/* search */}
        <div className="flex gap-3">
          <Input
            placeholder="Search staff by name or email."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* PENDING INVITES */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Pending Invites</h2>
          {pendingInvites.length === 0 ? (
            <Card className="p-6 text-muted-foreground text-sm">
              No pending invites. Click “Invite Staff” to generate a link.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingInvites.map((inv) => {
                const inviteLink = `${window.location.origin}/staff-invite/${inv.token}`;
                return (
                  <Card key={inv.id} className="hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {inv.email || 'No email set'}
                        <Badge variant="outline" className="text-xs">
                          pending
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Invited {new Date(inv.created_at).toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Input readOnly value={inviteLink} className="text-xs" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(inviteLink);
                            toast.success('Copied link');
                          }}
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Expires {new Date(inv.expires_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* LEGACY STAFF */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Existing Staff (old table)</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStaff.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {member.staff_name || 'Unnamed Staff'}
                      {member.is_active ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {member.staff_email || 'No email'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(member.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={member.is_active ? 'outline' : 'default'}
                      onClick={() => toggleActive(member)}
                    >
                      {member.is_active ? 'Disable' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">
              No staff yet. You can keep using invites instead.
            </Card>
          )}
        </div>
      </main>

      {showDialog && vendor && (
        <StaffFormDialog
          vendorId={vendor.id}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false);
            loadVendorAndStaff();
          }}
        />
      )}
    </div>
  );
}
