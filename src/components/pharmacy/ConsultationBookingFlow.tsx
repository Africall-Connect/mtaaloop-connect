import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationCard } from './ConsultationCard';
import { TimeSlotGrid } from './TimeSlotGrid';
import { PreConsultationForm } from './PreConsultationForm';
import {
  ConsultationType,
  ConsultationSlot,
  PreConsultationFormData,
} from '@/types/consultation';
import { formatBookingDateTime, formatTime12h } from '@/lib/consultationUtils';
import { format, isSameDay } from 'date-fns';
import {
  ArrowLeft, ArrowRight, MapPin, Star, Clock,
  Calendar as CalendarIcon, CheckCircle, Loader2, Stethoscope
} from 'lucide-react';

interface ConsultationBookingFlowProps {
  vendor: {
    id: string;
    business_name: string;
    business_address: string;
    logo_url: string | null;
    rating: number;
  };
  onClose: () => void;
}

type Step = 'select-type' | 'select-slot' | 'health-info' | 'confirm';

export function ConsultationBookingFlow({ vendor, onClose }: ConsultationBookingFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('select-type');
  const [loading, setLoading] = useState(false);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  
  const [selectedType, setSelectedType] = useState<ConsultationType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<ConsultationSlot | null>(null);
  const [healthInfo, setHealthInfo] = useState<PreConsultationFormData | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch consultation types
  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase
        .from('consultation_types')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (!error && data) {
        setConsultationTypes(data as unknown as ConsultationType[]);
      }
    };
    fetchTypes();
  }, [vendor.id]);

  // Fetch slots when type is selected
  useEffect(() => {
    if (!selectedType) return;

    const fetchSlots = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultation_slots')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_available', true)
        .eq('is_blocked', false)
        .gte('slot_date', format(new Date(), 'yyyy-MM-dd'))
        .order('slot_date', { ascending: true })
        .order('slot_start', { ascending: true });

      if (!error && data) {
        setSlots(data as unknown as ConsultationSlot[]);
      }
      setLoading(false);
    };
    fetchSlots();
  }, [selectedType, vendor.id]);

  const slotsForDate = slots.filter(s => isSameDay(new Date(s.slot_date), selectedDate));

  const handleSelectType = (type: ConsultationType) => {
    setSelectedType(type);
    setStep('select-slot');
  };

  const handleSelectSlot = (slot: ConsultationSlot) => {
    setSelectedSlot(slot);
  };

  const handleHealthInfoSubmit = (data: PreConsultationFormData) => {
    setHealthInfo(data);
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedType || !selectedSlot || !healthInfo) return;

    setSubmitting(true);
    try {
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('consultation_bookings')
        .insert({
          slot_id: selectedSlot.id,
          customer_id: user.id,
          vendor_id: vendor.id,
          consultation_type_id: selectedType.id,
          amount: selectedType.price,
          booking_date: selectedSlot.slot_date,
          booking_time: selectedSlot.slot_start,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create pre-consultation info
      const { error: preInfoError } = await supabase
        .from('consultation_pre_info')
        .insert({
          booking_id: booking.id,
          symptoms: healthInfo.symptoms,
          symptom_duration: healthInfo.symptom_duration,
          has_allergies: healthInfo.has_allergies,
          allergies_details: healthInfo.allergies_details || null,
          has_chronic_conditions: healthInfo.has_chronic_conditions,
          chronic_conditions: healthInfo.chronic_conditions || null,
          current_medications: healthInfo.current_medications || null,
          is_pregnant: healthInfo.is_pregnant,
          is_breastfeeding: healthInfo.is_breastfeeding,
          age_group: healthInfo.age_group,
          additional_notes: healthInfo.additional_notes || null,
        });

      if (preInfoError) throw preInfoError;

      toast({
        title: 'Consultation Booked!',
        description: `Your consultation is scheduled for ${formatBookingDateTime(selectedSlot.slot_date, selectedSlot.slot_start)}`,
      });

      onClose();
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'Unable to complete your booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'select-slot') setStep('select-type');
    else if (step === 'health-info') setStep('select-slot');
    else if (step === 'confirm') setStep('health-info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step !== 'select-type' && (
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold">Book Consultation</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{vendor.business_name}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {vendor.business_address}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {vendor.rating.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {(['select-type', 'select-slot', 'health-info', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-primary text-primary-foreground' : 
              i < ['select-type', 'select-slot', 'health-info', 'confirm'].indexOf(step) 
                ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            {i < 3 && <div className="w-8 h-0.5 bg-muted" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'select-type' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Select Consultation Type</h3>
          {consultationTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No consultation types available</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {consultationTypes.map(type => (
                <ConsultationCard
                  key={type.id}
                  consultation={type}
                  onSelect={handleSelectType}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'select-slot' && selectedType && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Select Date & Time</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedType.name} • {selectedType.duration_minutes} min • KSh {selectedType.price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }
                }}
                className="rounded-md pointer-events-auto"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <h4 className="font-medium mb-4">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h4>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <TimeSlotGrid
                  slots={slotsForDate}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                />
              )}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!selectedSlot}
            onClick={() => setStep('health-info')}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 'health-info' && (
        <PreConsultationForm
          onSubmit={handleHealthInfoSubmit}
          onBack={goBack}
        />
      )}

      {step === 'confirm' && selectedType && selectedSlot && healthInfo && (
        <div className="space-y-6">
          <h3 className="font-semibold">Confirm Your Booking</h3>

          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{selectedType.name}</h4>
                <p className="text-sm text-muted-foreground">{vendor.business_name}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">
                  KSh {selectedType.price.toLocaleString()}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(selectedSlot.slot_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatTime12h(selectedSlot.slot_start)} - {formatTime12h(selectedSlot.slot_end)} EAT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{vendor.business_address}</span>
              </div>
            </div>

            <Separator />

            <div>
              <h5 className="font-medium mb-2">Health Summary</h5>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><strong>Symptoms:</strong> {healthInfo.symptoms.slice(0, 100)}...</p>
                <p><strong>Duration:</strong> {healthInfo.symptom_duration}</p>
                {healthInfo.has_allergies && <Badge variant="destructive" className="text-xs">Has Allergies</Badge>}
                {healthInfo.has_chronic_conditions && <Badge variant="secondary" className="text-xs">Chronic Conditions</Badge>}
              </div>
            </div>
          </div>

          <Label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
            <Checkbox
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              I confirm that the information provided is accurate and I agree to the 
              consultation terms and conditions.
            </span>
          </Label>

          <Button
            className="w-full"
            size="lg"
            disabled={!agreedToTerms || submitting}
            onClick={handleConfirmBooking}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
