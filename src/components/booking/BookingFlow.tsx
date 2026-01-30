import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingServiceCard } from './BookingServiceCard';
import { BookingTimeSlotGrid } from './BookingTimeSlotGrid';
import { BookingServiceType, BookingTimeSlot } from '@/types/booking';
import { VendorWithProducts } from '@/types/database';
import { formatTime12h } from '@/lib/bookingUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import { 
  ArrowLeft, 
  CalendarCheck, 
  Clock, 
  MapPin, 
  Check, 
  Loader2,
  FileText,
  Star
} from 'lucide-react';

interface BookingFlowProps {
  vendor: VendorWithProducts;
  initialService?: BookingServiceType | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'service' | 'datetime' | 'notes' | 'confirm';

export function BookingFlow({ vendor, initialService, onClose, onSuccess }: BookingFlowProps) {
  const { toast } = useToast();
  
  // State
  const [step, setStep] = useState<Step>(initialService ? 'datetime' : 'service');
  const [serviceTypes, setServiceTypes] = useState<BookingServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<BookingServiceType | null>(initialService || null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<BookingTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingTimeSlot | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch service types
  const fetchServiceTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('booking_service_types')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching service types:', error);
      return;
    }
    
    setServiceTypes(data || []);
  }, [vendor.id]);

  // Fetch slots for selected date
  const fetchSlots = useCallback(async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('booking_time_slots')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('slot_date', dateStr)
      .eq('is_available', true)
      .eq('is_blocked', false)
      .order('slot_start');

    if (error) {
      console.error('Error fetching slots:', error);
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  }, [vendor.id, selectedDate]);

  useEffect(() => {
    fetchServiceTypes();
  }, [fetchServiceTypes]);

  useEffect(() => {
    if (step === 'datetime') {
      fetchSlots();
    }
  }, [step, selectedDate, fetchSlots]);

  const handleServiceSelect = (service: BookingServiceType) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelect = (slot: BookingTimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedSlot) return;
    
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Please log in',
          description: 'You need to be logged in to make a booking.',
          variant: 'destructive',
        });
        return;
      }

      // Create reservation
      const { error: reservationError } = await supabase
        .from('booking_reservations')
        .insert({
          customer_id: user.id,
          vendor_id: vendor.id,
          service_type_id: selectedService.id,
          slot_id: selectedSlot.id,
          booking_date: selectedSlot.slot_date,
          booking_time: selectedSlot.slot_start,
          amount: selectedService.price,
          customer_notes: customerNotes || null,
          status: 'pending',
          payment_status: 'pending',
        });

      if (reservationError) throw reservationError;

      // Mark slot as unavailable
      await supabase
        .from('booking_time_slots')
        .update({ is_available: false })
        .eq('id', selectedSlot.id);

      toast({
        title: 'Booking Confirmed! 🎉',
        description: `Your ${selectedService.name} has been booked for ${format(new Date(selectedSlot.slot_date), 'MMM d')} at ${formatTime12h(selectedSlot.slot_start)}.`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'datetime') setStep('service');
    else if (step === 'notes') setStep('datetime');
    else if (step === 'confirm') setStep('notes');
  };

  const canProceed = () => {
    if (step === 'datetime') return !!selectedSlot;
    if (step === 'notes') return true;
    if (step === 'confirm') return agreedToTerms;
    return false;
  };

  const steps = ['service', 'datetime', 'notes', 'confirm'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        {step !== 'service' && (
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-lg">Book a Service</h2>
          <p className="text-sm text-muted-foreground">{vendor.business_name}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 py-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i <= currentStepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4">
        {step === 'service' && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Select a Service</h3>
            {serviceTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No services available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {serviceTypes.map(service => (
                  <BookingServiceCard
                    key={service.id}
                    service={service}
                    onBook={() => handleServiceSelect(service)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'datetime' && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Select Date & Time</h3>
            
            {/* Selected Service Summary */}
            {selectedService && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedService.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedService.duration_minutes} min • KES {selectedService.price.toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('service')}>
                  Change
                </Button>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Calendar */}
              <div className="bg-card rounded-lg border p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md"
                />
              </div>

              {/* Time Slots */}
              <div className="bg-card rounded-lg border p-4">
                <h4 className="font-medium mb-3">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </h4>
                <BookingTimeSlotGrid
                  slots={slots}
                  selectedSlotId={selectedSlot?.id}
                  onSelectSlot={handleSlotSelect}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-lg">Add Notes for the Vendor</h3>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Share any special requests, preferences, or information the vendor should know.
            </p>

            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g., I prefer gentle pressure for massages, or I'm celebrating a birthday..."
              rows={5}
              className="resize-none"
            />

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Examples:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Specific preferences (e.g., pressure level, style)</li>
                <li>• Allergies or sensitivities</li>
                <li>• Special occasions or celebrations</li>
                <li>• Preferred communication method</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedService && selectedSlot && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Confirm Your Booking</h3>

            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{selectedService.name}</h4>
                  <p className="text-sm text-muted-foreground">{vendor.business_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">KES {selectedService.price.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{format(new Date(selectedSlot.slot_date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {formatTime12h(selectedSlot.slot_start)} - {formatTime12h(selectedSlot.slot_end)} EAT
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{vendor.business_address}</p>
                </div>
              </div>

              {customerNotes && (
                <div className="p-3 bg-card rounded-lg border">
                  <Label className="text-muted-foreground text-xs uppercase">Your Notes</Label>
                  <p className="text-sm mt-1">{customerNotes}</p>
                </div>
              )}
            </div>

            <div className="flex items-start space-x-2 pt-4">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                I confirm this booking and agree to the vendor's terms and cancellation policy.
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {step !== 'service' && (
        <div className="pt-4 border-t">
          {step === 'confirm' ? (
            <Button
              className="w-full min-h-[48px]"
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          ) : (
            <Button
              className="w-full min-h-[48px]"
              onClick={() => {
                if (step === 'datetime') setStep('notes');
                else if (step === 'notes') setStep('confirm');
              }}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
