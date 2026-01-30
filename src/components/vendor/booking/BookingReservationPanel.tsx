import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookingReservation, BookingStatus, BOOKING_STATUS_LABELS, BOOKING_PAYMENT_STATUS_LABELS } from '@/types/booking';
import { formatTime12h } from '@/lib/bookingUtils';
import { format } from 'date-fns';
import { Calendar, Clock, User, FileText, CreditCard, MapPin, Loader2 } from 'lucide-react';

interface BookingReservationPanelProps {
  reservation: BookingReservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: BookingStatus, vendorNotes?: string) => Promise<void>;
  loading?: boolean;
}

const STATUS_OPTIONS: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

export function BookingReservationPanel({
  reservation,
  open,
  onOpenChange,
  onUpdateStatus,
  loading,
}: BookingReservationPanelProps) {
  const [status, setStatus] = useState<BookingStatus>(reservation?.status || 'pending');
  const [vendorNotes, setVendorNotes] = useState(reservation?.vendor_notes || '');
  const [saving, setSaving] = useState(false);

  // Update local state when reservation changes
  if (reservation && reservation.status !== status && !saving) {
    setStatus(reservation.status);
    setVendorNotes(reservation.vendor_notes || '');
  }

  const handleSave = async () => {
    if (!reservation) return;
    
    setSaving(true);
    try {
      await onUpdateStatus(reservation.id, status, vendorNotes);
    } finally {
      setSaving(false);
    }
  };

  if (!reservation) return null;

  const statusInfo = BOOKING_STATUS_LABELS[reservation.status];
  const paymentInfo = BOOKING_PAYMENT_STATUS_LABELS[reservation.payment_status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <Badge className={paymentInfo.color}>{paymentInfo.label}</Badge>
          </div>

          {/* Service Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-lg">{reservation.service_type?.name || 'Service'}</h4>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(reservation.booking_date), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTime12h(reservation.booking_time)} EAT</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">KES {reservation.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase">Customer</Label>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{reservation.customer?.full_name || 'Customer'}</p>
                <p className="text-sm text-muted-foreground">{reservation.customer?.email}</p>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {reservation.customer_notes && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Customer Notes
              </Label>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {reservation.customer_notes}
              </div>
            </div>
          )}

          {/* Update Status */}
          <div className="space-y-2">
            <Label>Update Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as BookingStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>
                    {BOOKING_STATUS_LABELS[opt].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor Notes */}
          <div className="space-y-2">
            <Label htmlFor="vendorNotes">Your Notes</Label>
            <Textarea
              id="vendorNotes"
              value={vendorNotes}
              onChange={(e) => setVendorNotes(e.target.value)}
              placeholder="Add any notes about this booking..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={loading || saving}>
              {(loading || saving) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground pt-4 border-t space-y-1">
            <p>Created: {format(new Date(reservation.created_at), 'MMM d, yyyy h:mm a')}</p>
            <p>Updated: {format(new Date(reservation.updated_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
