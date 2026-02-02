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
  BookingReservation,
  BOOKING_STATUS_LABELS,
  DURATION_OPTIONS,
} from '@/types/booking';
import { format, isPast, isFuture, isToday } from 'date-fns';
import {
  Calendar, Clock, MapPin, CalendarCheck, AlertCircle,
  Loader2, ArrowLeft, XCircle, CheckCircle, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTime12h } from '@/lib/bookingUtils';

type BookingWithDetails = BookingReservation & {
  service_type?: { name: string; duration_minutes: number; category: string | null };
  vendor?: { business_name: string; business_address: string; logo_url: string | null; slug: string };
};

export default function MyBookings() {
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
        .from('booking_reservations')
        .select(`
          *,
          booking_service_types (name, duration_minutes, category),
          vendor_profiles (business_name, business_address, logo_url, slug)
        `)
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: false });

      if (!error && data) {
        const mapped = data.map((b: Record<string, unknown>) => ({
          ...b,
          service_type: b.booking_service_types,
          vendor: b.vendor_profiles,
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
    (isPast(new Date(b.booking_date)) && !['pending', 'confirmed', 'cancelled'].includes(b.status))
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
      .from('booking_reservations')
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
        description: 'Your booking has been cancelled.',
      });
      setBookings(prev => 
        prev.map(b => b.id === bookingToCancel.id ? { ...b, status: 'cancelled' as const } : b)
      );
    }

    setCancellingId(null);
    setShowCancelDialog(false);
    setBookingToCancel(null);
  };

  const getDurationLabel = (minutes: number) => {
    return DURATION_OPTIONS.find(d => d.value === minutes)?.label || `${minutes} min`;
  };

  const renderBookingCard = (booking: BookingWithDetails) => {
    const statusInfo = BOOKING_STATUS_LABELS[booking.status];
    const canCancel = ['pending', 'confirmed'].includes(booking.status);

    return (
      <div key={booking.id} className="bg-card border rounded-xl p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full shrink-0">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{booking.service_type?.name || 'Service'}</h3>
              <p 
                className="text-sm text-muted-foreground hover:text-primary cursor-pointer"
                onClick={() => booking.vendor?.slug && navigate(`/vendor/${booking.vendor.slug}`)}
              >
                {booking.vendor?.business_name}
              </p>
              {booking.service_type?.category && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {booking.service_type.category}
                </Badge>
              )}
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
            {formatTime12h(booking.booking_time)} • {getDurationLabel(booking.service_type?.duration_minutes || 60)}
          </div>
          {booking.vendor?.business_address && (
            <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
              <MapPin className="h-4 w-4" />
              {booking.vendor.business_address}
            </div>
          )}
        </div>

        {booking.customer_notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-medium mb-1">Your Notes</p>
            <p className="text-sm">{booking.customer_notes}</p>
          </div>
        )}

        {booking.vendor_notes && booking.status === 'completed' && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-xs text-muted-foreground font-medium mb-1">Vendor Notes</p>
            <p className="text-sm">{booking.vendor_notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-lg font-bold text-primary">
            <Banknote className="h-5 w-5" />
            KES {booking.amount.toLocaleString()}
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
                <CalendarCheck className="h-5 w-5 text-primary" />
                My Bookings
              </h1>
              <p className="text-sm text-muted-foreground">
                View and manage your service bookings
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
                <h3 className="font-semibold mb-1">No Upcoming Bookings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book a service to get started
                </p>
                <Button onClick={() => navigate('/home')}>
                  Browse Services
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
                <h3 className="font-semibold mb-1">No Past Bookings</h3>
                <p className="text-sm text-muted-foreground">
                  Your completed bookings will appear here
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
                <h3 className="font-semibold mb-1">No Cancelled Bookings</h3>
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
            <DialogTitle>Cancel Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {bookingToCancel && (
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="font-medium">{bookingToCancel.service_type?.name}</p>
              <p className="text-muted-foreground">
                {format(new Date(bookingToCancel.booking_date), 'EEE, MMM d, yyyy')} at {formatTime12h(bookingToCancel.booking_time)}
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
