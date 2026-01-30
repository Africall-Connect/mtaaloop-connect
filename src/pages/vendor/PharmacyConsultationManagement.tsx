import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ConsultationTypeForm } from '@/components/vendor/consultation/ConsultationTypeForm';
import { AvailabilityScheduler } from '@/components/vendor/consultation/AvailabilityScheduler';
import { SlotCalendar } from '@/components/vendor/consultation/SlotCalendar';
import { BookingDetailPanel } from '@/components/vendor/consultation/BookingDetailPanel';
import {
  ConsultationType,
  ConsultationTypeFormData,
  ConsultationAvailability,
  ConsultationSlot,
  ConsultationBooking,
  ConsultationPreInfo,
  CONSULTATION_STATUS_LABELS,
} from '@/types/consultation';
import { formatBookingDateTime, generateSlotsForDateRange, getDefaultAvailability } from '@/lib/consultationUtils';
import { format, addDays } from 'date-fns';
import {
  Stethoscope, Clock, Calendar, ClipboardList,
  Plus, Edit2, Trash2, Loader2, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PharmacyConsultationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('types');
  
  // Data states
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [availability, setAvailability] = useState<ConsultationAvailability[]>([]);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [bookings, setBookings] = useState<(ConsultationBooking & { pre_info?: ConsultationPreInfo })[]>([]);
  
  // UI states
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<ConsultationType | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<(ConsultationBooking & { pre_info?: ConsultationPreInfo }) | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Fetch vendor profile
  useEffect(() => {
    const fetchVendor = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setVendorId(data.id);
      }
      setLoading(false);
    };
    fetchVendor();
  }, [user]);

  // Fetch all data when vendor ID is available
  const fetchData = useCallback(async () => {
    if (!vendorId) return;

    const [typesRes, availRes, slotsRes, bookingsRes] = await Promise.all([
      supabase.from('consultation_types').select('*').eq('vendor_id', vendorId).order('created_at'),
      supabase.from('consultation_availability').select('*').eq('vendor_id', vendorId),
      supabase.from('consultation_slots').select('*').eq('vendor_id', vendorId).gte('slot_date', format(new Date(), 'yyyy-MM-dd')).order('slot_date').order('slot_start'),
      supabase.from('consultation_bookings').select(`
        *,
        consultation_types (*),
        consultation_pre_info (*)
      `).eq('vendor_id', vendorId).order('booking_date', { ascending: false }),
    ]);

    if (typesRes.data) setConsultationTypes(typesRes.data as unknown as ConsultationType[]);
    if (availRes.data) setAvailability(availRes.data as unknown as ConsultationAvailability[]);
    if (slotsRes.data) setSlots(slotsRes.data as unknown as ConsultationSlot[]);
    if (bookingsRes.data) {
      const mapped = bookingsRes.data.map((b: Record<string, unknown>) => ({
        ...b,
        consultation_type: b.consultation_types,
        pre_info: Array.isArray(b.consultation_pre_info) ? b.consultation_pre_info[0] : b.consultation_pre_info,
      }));
      setBookings(mapped as unknown as (ConsultationBooking & { pre_info?: ConsultationPreInfo })[]);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD for Consultation Types
  const handleSaveType = async (data: ConsultationTypeFormData) => {
    if (!vendorId) return;

    if (editingType) {
      const { error } = await supabase
        .from('consultation_types')
        .update(data)
        .eq('id', editingType.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Updated', description: 'Consultation type updated successfully' });
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('consultation_types')
        .insert({ ...data, vendor_id: vendorId });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Created', description: 'Consultation type created successfully' });
        fetchData();
      }
    }

    setShowTypeForm(false);
    setEditingType(null);
  };

  const handleDeleteType = async (id: string) => {
    const { error } = await supabase.from('consultation_types').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Consultation type deleted' });
      fetchData();
    }
  };

  // Save Availability
  const handleSaveAvailability = async (data: Partial<ConsultationAvailability>[]) => {
    if (!vendorId) return;
    setSavingAvailability(true);

    // Delete existing and insert new
    await supabase.from('consultation_availability').delete().eq('vendor_id', vendorId);
    
    const { error } = await supabase
      .from('consultation_availability')
      .insert(data.map(d => ({ ...d, vendor_id: vendorId })));

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Business hours updated' });
      fetchData();
    }
    setSavingAvailability(false);
  };

  // Generate Slots
  const handleGenerateSlots = async (startDate: Date, endDate: Date) => {
    if (!vendorId || consultationTypes.length === 0 || availability.length === 0) return;

    const primaryType = consultationTypes[0];
    const generated = generateSlotsForDateRange(startDate, endDate, availability, primaryType, slots);

    const slotsToInsert = generated.flatMap(({ date, slots: daySlots }) =>
      daySlots.map(s => ({
        vendor_id: vendorId,
        consultation_type_id: primaryType.id,
        slot_date: format(date, 'yyyy-MM-dd'),
        slot_start: s.start,
        slot_end: s.end,
        is_available: true,
        is_blocked: false,
      }))
    );

    if (slotsToInsert.length > 0) {
      const { error } = await supabase.from('consultation_slots').insert(slotsToInsert);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Generated', description: `Created ${slotsToInsert.length} slots` });
        fetchData();
      }
    } else {
      toast({ title: 'No new slots', description: 'All slots already exist for this period' });
    }
  };

  // Toggle Slot Block
  const handleToggleSlotBlock = async (slotId: string, blocked: boolean) => {
    const { error } = await supabase
      .from('consultation_slots')
      .update({ is_blocked: blocked })
      .eq('id', slotId);

    if (!error) fetchData();
  };

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
    const updateData: Record<string, unknown> = { status };
    if (notes) updateData.pharmacist_notes = notes;

    const { error } = await supabase
      .from('consultation_bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: 'Booking status updated' });
      fetchData();
    }
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Consultation Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage consultation types, availability, and bookings
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
            <TabsTrigger value="types" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Types</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Hours</span>
            </TabsTrigger>
            <TabsTrigger value="slots" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Slots</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
              {bookings.filter(b => b.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {bookings.filter(b => b.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Consultation Types Tab */}
          <TabsContent value="types" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Consultation Types</h2>
              <Button onClick={() => { setEditingType(null); setShowTypeForm(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Type
              </Button>
            </div>

            {consultationTypes.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <Stethoscope className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Consultation Types</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create consultation types to start accepting bookings
                </p>
                <Button onClick={() => setShowTypeForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Type
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {consultationTypes.map(type => (
                  <div key={type.id} className="bg-card border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <Badge variant={type.is_active ? 'default' : 'secondary'} className="mt-1">
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingType(type); setShowTypeForm(true); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteType(type.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {type.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{type.duration_minutes} min</span>
                      <span className="font-semibold text-primary">KSh {type.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Type Form Dialog */}
            <Dialog open={showTypeForm} onOpenChange={setShowTypeForm}>
              <DialogContent className="max-w-md">
                <ConsultationTypeForm
                  initialData={editingType || undefined}
                  onSubmit={handleSaveType}
                  onCancel={() => { setShowTypeForm(false); setEditingType(null); }}
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability">
            <AvailabilityScheduler
              availability={availability}
              onSave={handleSaveAvailability}
              loading={savingAvailability}
            />
          </TabsContent>

          {/* Slots Tab */}
          <TabsContent value="slots">
            <SlotCalendar
              slots={slots}
              consultationTypes={consultationTypes}
              onGenerateSlots={handleGenerateSlots}
              onToggleSlotBlock={handleToggleSlotBlock}
            />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <h2 className="text-lg font-semibold">Consultation Bookings</h2>

            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Bookings Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Bookings will appear here once customers start booking
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => {
                  const statusInfo = CONSULTATION_STATUS_LABELS[booking.status];
                  return (
                    <div
                      key={booking.id}
                      className="bg-card border rounded-lg p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {booking.consultation_type?.name || 'Consultation'}
                          </span>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatBookingDateTime(booking.booking_date, booking.booking_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          KSh {booking.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Booking Detail Panel */}
            {selectedBooking && (
              <BookingDetailPanel
                booking={selectedBooking}
                open={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onUpdateStatus={handleUpdateBookingStatus}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
