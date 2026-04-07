import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle, XCircle, Bike, Phone, Mail, CreditCard, Car, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationDetailsDialog } from '@/components/admin/ApplicationDetailsDialog';

interface RiderProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  id_number: string;
  vehicle_type: string;
  vehicle_registration: string;
  license_number: string;
  estate_id: string | null;
  is_approved: boolean;
  created_at: string;
  estates?: {
    name: string;
    location: string;
  };
}

export default function RiderApprovals() {
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<RiderProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [viewRider, setViewRider] = useState<RiderProfile | null>(null);

  const downloadRider = (rider: RiderProfile) => {
    try {
      const blob = new Blob([JSON.stringify(rider, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rider-${rider.full_name.replace(/\s+/g, '-')}-${rider.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const { data, error } = await supabase
        .from('rider_profiles')
        .select(`
          *,
          estates (
            name,
            location
          )
        `)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiders(data || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Failed to load rider applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (riderId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('approve_rider', {
        rider_profile_id: riderId,
      });

      if (error) throw error;

      toast.success('Rider approved successfully');
      fetchRiders();
    } catch (error) {
      console.error('Error approving rider:', error);
      toast.error('Failed to approve rider');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRider || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reject_rider', {
        rider_profile_id: selectedRider.id,
        reason: rejectionReason,
      });

      if (error) throw error;

      toast.success('Rider rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedRider(null);
      fetchRiders();
    } catch (error) {
      console.error('Error rejecting rider:', error);
      toast.error('Failed to reject rider');
    } finally {
      setProcessing(false);
    }
  };

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
            <div>
              <h1 className="text-2xl font-bold">Rider Approvals</h1>
              <p className="text-sm text-muted-foreground">
                Review and approve rider applications
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : riders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
              <p className="text-muted-foreground">
                All rider applications have been processed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {riders.map((rider) => (
              <Card key={rider.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bike className="h-5 w-5" />
                        {rider.full_name}
                      </CardTitle>
                      <Badge variant="outline" className="mt-2">
                        {rider.vehicle_type}
                      </Badge>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Personal Information</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{rider.phone}</span>
                        </div>
                        {rider.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{rider.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>ID: {rider.id_number}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Vehicle Information</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>Reg: {rider.vehicle_registration || 'N/A'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">License: </span>
                          {rider.license_number || 'N/A'}
                        </div>
                        {rider.estates && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Primary Estate: </span>
                            {rider.estates.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button
                        onClick={() => setViewRider(rider)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        onClick={() => downloadRider(rider)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleApprove(rider.id)}
                        disabled={processing}
                        size="sm"
                        className="flex-1 min-w-[120px]"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRider(rider);
                          setShowRejectDialog(true);
                        }}
                        disabled={processing}
                        variant="destructive"
                        size="sm"
                        className="flex-1 min-w-[120px]"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <ApplicationDetailsDialog
        open={!!viewRider}
        onOpenChange={(o) => !o && setViewRider(null)}
        title={viewRider?.full_name || 'Rider Application'}
        data={viewRider}
        documentFields={['id_document_url', 'license_document_url', 'vehicle_photo_url', 'profile_photo_url']}
      />

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Rider Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this rider application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedRider(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReject} variant="destructive" disabled={processing}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
