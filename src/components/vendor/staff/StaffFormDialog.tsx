import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffFormDialogProps {
  vendorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffFormDialog({ vendorId, onClose, onSuccess }: StaffFormDialogProps) {
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1) make a token
      const token = crypto.randomUUID(); // fine for invite links

      // 2) insert invite
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase.from('vendor_staff_invites').insert([
        {
          vendor_id: vendorId,
          email: staffEmail || null,
          token,
          created_by: user.user?.id ?? null,
        },
      ]);

      if (error) throw error;

      const url = `${window.location.origin}/staff-invite/${token}`;
      setInviteLink(url);
      toast.success('Invite created. Copy the link and send to your staff.');
      onSuccess();
    } catch (err: unknown) {
      toast.error('Failed to create invite', { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staffName">Full Name (optional)</Label>
            <Input
              id="staffName"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Jane Wanjiru"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staffEmail">Email (recommended)</Label>
            <Input
              id="staffEmail"
              type="email"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="jane@example.com"
            />
            <p className="text-xs text-muted-foreground">
              If you set an email, we can later enforce that only this email may accept the invite.
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invite'}
            </Button>
          </div>

          {inviteLink && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs">Invite link</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    toast.success('Copied link to clipboard');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
