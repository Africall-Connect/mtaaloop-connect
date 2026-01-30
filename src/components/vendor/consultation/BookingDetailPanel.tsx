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
import { Separator } from '@/components/ui/separator';
import { ConsultationBooking, ConsultationPreInfo, CONSULTATION_STATUS_LABELS } from '@/types/consultation';
import { formatBookingDateTime } from '@/lib/consultationUtils';
import {
  User, Calendar, Clock, FileText, Pill, AlertCircle,
  CheckCircle, XCircle, AlertTriangle, Loader2
} from 'lucide-react';

interface BookingDetailPanelProps {
  booking: ConsultationBooking & { pre_info?: ConsultationPreInfo };
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (bookingId: string, status: string, notes?: string) => Promise<void>;
}

export function BookingDetailPanel({ booking, open, onClose, onUpdateStatus }: BookingDetailPanelProps) {
  const [notes, setNotes] = useState(booking.pharmacist_notes || '');
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusUpdate = async (status: string) => {
    setLoading(status);
    try {
      await onUpdateStatus(booking.id, status, notes);
      onClose();
    } finally {
      setLoading(null);
    }
  };

  const statusInfo = CONSULTATION_STATUS_LABELS[booking.status];
  const preInfo = booking.pre_info;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Booking Details
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <span className="text-sm text-muted-foreground">
              #{booking.id.slice(0, 8)}
            </span>
          </div>

          {/* Booking Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatBookingDateTime(booking.booking_date, booking.booking_time)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{booking.consultation_type?.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{booking.consultation_type?.name}</span>
            </div>
          </div>

          <Separator />

          {/* Pre-Consultation Info */}
          {preInfo && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Pre-Consultation Information
              </h4>

              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Symptoms</Label>
                  <p className="mt-1">{preInfo.symptoms}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="mt-1">{preInfo.symptom_duration}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Age Group</Label>
                  <p className="mt-1 capitalize">{preInfo.age_group}</p>
                </div>

                {preInfo.has_allergies && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <Label className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Allergies
                    </Label>
                    <p className="mt-1 text-red-700 dark:text-red-300">
                      {preInfo.allergies_details || 'Yes, details not provided'}
                    </p>
                  </div>
                )}

                {preInfo.has_chronic_conditions && preInfo.chronic_conditions && (
                  <div>
                    <Label className="text-muted-foreground">Chronic Conditions</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {preInfo.chronic_conditions.map((condition, i) => (
                        <Badge key={i} variant="secondary">{condition}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {preInfo.current_medications && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <Label className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Pill className="h-3 w-3" />
                      Current Medications
                    </Label>
                    <p className="mt-1">{preInfo.current_medications}</p>
                  </div>
                )}

                {(preInfo.is_pregnant || preInfo.is_breastfeeding) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <Label className="text-amber-600 dark:text-amber-400">Special Considerations</Label>
                    <div className="mt-1 space-y-1">
                      {preInfo.is_pregnant && <p>• Currently pregnant</p>}
                      {preInfo.is_breastfeeding && <p>• Currently breastfeeding</p>}
                    </div>
                  </div>
                )}

                {preInfo.additional_notes && (
                  <div>
                    <Label className="text-muted-foreground">Additional Notes</Label>
                    <p className="mt-1">{preInfo.additional_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Pharmacist Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Pharmacist Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this consultation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <div className="space-y-3 pt-4">
              <Label className="text-muted-foreground">Update Status</Label>
              <div className="flex flex-wrap gap-2">
                {booking.status === 'pending' && (
                  <Button
                    onClick={() => handleStatusUpdate('confirmed')}
                    disabled={loading !== null}
                    className="gap-2"
                  >
                    {loading === 'confirmed' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Confirm Booking
                  </Button>
                )}
                
                {booking.status === 'confirmed' && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={loading !== null}
                      className="gap-2"
                    >
                      {loading === 'in_progress' && <Loader2 className="h-4 w-4 animate-spin" />}
                      Start Consultation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate('no_show')}
                      disabled={loading !== null}
                      className="gap-2"
                    >
                      {loading === 'no_show' && <Loader2 className="h-4 w-4 animate-spin" />}
                      <AlertTriangle className="h-4 w-4" />
                      No Show
                    </Button>
                  </>
                )}

                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={loading !== null}
                  className="gap-2"
                >
                  {loading === 'cancelled' && <Loader2 className="h-4 w-4 animate-spin" />}
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {booking.status === 'in_progress' && (
            <Button
              onClick={() => handleStatusUpdate('completed')}
              disabled={loading !== null}
              className="w-full gap-2"
            >
              {loading === 'completed' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Complete Consultation
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
