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
import { ArrowLeft, CheckCircle, XCircle, Building2, MapPin, Phone, Mail, Home } from 'lucide-react';
import { toast } from 'sonner';

interface Estate {
  id: string;
  name: string;
  slug: string;
  location: string;
  county: string;
  address: string;
  total_units: number;
  manager_name: string;
  manager_phone: string;
  manager_email: string;
  is_approved: boolean;
  created_at: string;
}

export default function EstateApprovals() {
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstate, setSelectedEstate] = useState<Estate | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEstates();
  }, []);

  const fetchEstates = async () => {
    try {
      const { data, error } = await supabase
        .from('estates')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstates(data || []);
    } catch (error) {
      console.error('Error fetching estates:', error);
      toast.error('Failed to load estate applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (estateId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('approve_estate', {
        estate_id: estateId,
      });

      if (error) throw error;

      toast.success('Estate approved successfully');
      fetchEstates();
    } catch (error) {
      console.error('Error approving estate:', error);
      toast.error('Failed to approve estate');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEstate || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reject_estate', {
        estate_id: selectedEstate.id,
        reason: rejectionReason,
      });

      if (error) throw error;

      toast.success('Estate rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedEstate(null);
      fetchEstates();
    } catch (error) {
      console.error('Error rejecting estate:', error);
      toast.error('Failed to reject estate');
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
              <h1 className="text-2xl font-bold">Estate Approvals</h1>
              <p className="text-sm text-muted-foreground">
                Review and approve estate registrations
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
        ) : estates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
              <p className="text-muted-foreground">
                All estate applications have been processed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {estates.map((estate) => (
              <Card key={estate.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {estate.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{estate.county}</Badge>
                        <Badge variant="secondary">
                          <Home className="h-3 w-3 mr-1" />
                          {estate.total_units} units
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Estate Details</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{estate.location}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{estate.address}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Manager Information</h4>
                        <p className="text-sm font-medium">{estate.manager_name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{estate.manager_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{estate.manager_email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApprove(estate.id)}
                        disabled={processing}
                        className="flex-1"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedEstate(estate);
                          setShowRejectDialog(true);
                        }}
                        disabled={processing}
                        variant="destructive"
                        className="flex-1"
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Estate Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this estate application.
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
                setSelectedEstate(null);
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
