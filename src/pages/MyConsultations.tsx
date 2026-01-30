import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ConsultationBooking,
  ConsultationPreInfo,
  CONSULTATION_STATUS_LABELS,
} from '@/types/consultation';
import { formatBookingDateTime } from '@/lib/consultationUtils';
import { format, isPast, isFuture, isToday } from 'date-fns';
import {
  Calendar, Clock, MapPin, Stethoscope, AlertCircle,
  Loader2, ArrowLeft, XCircle, FileText, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type BookingWithDetails = ConsultationBooking & {
  consultation_type?: { name: string; duration_minutes: number };
  vendor?: { business_name: string; business_address: string; logo_url: string | null };
  pre_info?: ConsultationPreInfo;
};

export default function MyConsultations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingWithDetails | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('consultation_bookings')
        .select(`
          *,
          consultation_types (name, duration_minutes),
          vendor_profiles (business_name, business_address, logo_url),
          consultation_pre_info (*)
        `)
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: false });

      if (!error && data) {
        const mapped = data.map((b: Record<string, unknown>) => ({
          ...b,
          consultation_type: b.consultation_types,
          vendor: b.vendor_profiles,
          pre_info: Array.isArray(b.consultation_pre_info) 
            ? b.consultation_pre_info[0] 
            : b.consultation_pre_info,
        }));
        setBookings(mapped as unknown as BookingWithDetails[]);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [user]);

  const upcomingBookings = bookings.filter(b => 
    ['pending', 'confirmed'].includes(b.status) && 
    (isFuture(new Date(b.booking_date)) || isToday(new Date(b.booking_date)))
  );

  const pastBookings = bookings.filter(b => 
    ['completed', 'no_show', 'in_progress'].includes(b.status) || 
    isPast(new Date(b.booking_date))
  );

  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const handleCancelClick = (booking: BookingWithDetails) => {
    setBookingToCancel(booking);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    setCancellingId(bookingToCancel.id);
    const { error } = await supabase
      .from('consultation_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingToCancel.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Booking Cancelled',
        description: 'Your consultation has been cancelled.',
      });
      setBookings(prev => 
        prev.map(b => b.id === bookingToCancel.id ? { ...b, status: 'cancelled' as const } : b)
      );
    }

    setCancellingId(null);
    setShowCancelDialog(false);
    setBookingToCancel(null);
  };

  const renderBookingCard = (booking: BookingWithDetails) => {
    const statusInfo = CONSULTATION_STATUS_LABELS[booking.status];
    const canCancel = ['pending', 'confirmed'].includes(booking.status);

    return (
      <div key={booking.id} className="bg-card border rounded-xl p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full shrink-0">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{booking.consultation_type?.name || 'Consultation'}</h3>
              <p className="text-sm text-muted-foreground">{booking.vendor?.business_name}</p>
            </div>
          </div>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(booking.booking_date), 'EEE, MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {booking.booking_time} EAT • {booking.consultation_type?.duration_minutes} min
          </div>
          <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
            <MapPin className="h-4 w-4" />
            {booking.vendor?.business_address}
          </div>
        </div>

        {booking.pharmacist_notes && booking.status === 'completed' && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <FileText className="h-4 w-4" />
              Pharmacist Notes
            </div>
            <p className="text-sm text-muted-foreground">{booking.pharmacist_notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-lg font-bold text-primary">
            KSh {booking.amount.toLocaleString()}
          </div>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelClick(booking)}
              disabled={cancellingId === booking.id}
              className="gap-2 text-destructive hover:text-destructive"
            >
              {cancellingId === booking.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                My Consultations
              </h1>
              <p className="text-sm text-muted-foreground">
                View and manage your pharmacy consultations
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              {upcomingBookings.length > 0 && (
                <Badge variant="default" className="ml-1">
                  {upcomingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Upcoming Consultations</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book a pharmacy consultation to get started
                </p>
                <Button onClick={() => navigate('/health')}>
                  Find a Pharmacy
                </Button>
              </div>
            ) : (
              upcomingBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Past Consultations</h3>
                <p className="text-sm text-muted-foreground">
                  Your completed consultations will appear here
                </p>
              </div>
            ) : (
              pastBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Cancelled Consultations</h3>
                <p className="text-sm text-muted-foreground">
                  Cancelled bookings will appear here
                </p>
              </div>
            ) : (
              cancelledBookings.map(renderBookingCard)
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Consultation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this consultation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {bookingToCancel && (
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="font-medium">{bookingToCancel.consultation_type?.name}</p>
              <p className="text-muted-foreground">
                {formatBookingDateTime(bookingToCancel.booking_date, bookingToCancel.booking_time)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={!!cancellingId}>
              {cancellingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
