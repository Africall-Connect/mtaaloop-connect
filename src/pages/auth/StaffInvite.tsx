// src/pages/auth/StaffInvite.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface InviteRow {
  id: string;
  vendor_id: string;
  email: string | null;
  status: string;
  expires_at: string;
}

export default function StaffInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadInvite();
  }, [token]);

  const loadInvite = async () => {
    setLoading(true);
    try {
      // 👇 just fetch the invite; don't force login here
      const { data, error } = await supabase
        .from('vendor_staff_invites')
        .select('id, vendor_id, email, status, expires_at')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      setInvite(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Invite not found or expired');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invite) return;
    setAccepting(true);
    try {
      // must be logged in to accept
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        // show login/signup options
        setNeedsLogin(true);
        setAccepting(false);
        return;
      }

      // optional email match
      if (
        invite.email &&
        invite.email.toLowerCase() !== (authData.user.email ?? '').toLowerCase()
      ) {
        toast.error('This invite is for a different email address.');
        setAccepting(false);
        return;
      }

      // 1) link user to vendor
      const { error: mapErr } = await supabase
        .from('vendor_user_map')
        .insert([
          {
            vendor_id: invite.vendor_id,
            user_id: authData.user.id,
            role: 'staff',
          },
        ]);

      if (mapErr) throw mapErr;

      // 2) mark invite as accepted
      const { error: updErr } = await supabase
        .from('vendor_staff_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: authData.user.id,
        })
        .eq('id', invite.id);

      if (updErr) throw updErr;

      toast.success('You are now staff for this vendor!');
      navigate('/vendor/dashboard');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to accept invite', { description: (err as Error).message });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center space-y-3">
          <h1 className="text-xl font-bold">Invite not found</h1>
          <p className="text-muted-foreground">The link might be invalid or expired.</p>
          <Link to="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const expired = new Date(invite.expires_at).getTime() < Date.now();
  const redirectParam = encodeURIComponent(`/staff-invite/${token}`);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Join Vendor Team</h1>
        {expired ? (
          <p className="text-red-500 text-sm">This invite has expired.</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            You’ve been invited to join this vendor account as staff. Accept to continue.
          </p>
        )}

        {!expired && !needsLogin && (
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Accepting...' : 'Accept invite'}
            </Button>
        )}

        {/* 👇 show this only when the user tried to accept but wasn't logged in */}
        {!expired && needsLogin && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You need an account to accept this invite.
            </p>
            <Button asChild className="w-full">
              <Link to={`/auth/login?redirect=${redirectParam}`}>Login to continue</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/auth/signup?redirect=${redirectParam}`}>Create account</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
