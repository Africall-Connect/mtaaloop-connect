import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingServiceForm } from '@/components/vendor/booking/BookingServiceForm';
import { BookingAvailabilityScheduler } from '@/components/vendor/booking/BookingAvailabilityScheduler';
import { BookingSlotCalendar } from '@/components/vendor/booking/BookingSlotCalendar';
import { BookingReservationPanel } from '@/components/vendor/booking/BookingReservationPanel';
import {
  BookingServiceType,
  BookingAvailability,
  BookingTimeSlot,
  BookingReservation,
  BookingStatus,
  BOOKING_STATUS_LABELS,
  DURATION_OPTIONS,
} from '@/types/booking';
import { generateSlotsForDateRange } from '@/lib/bookingUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CalendarCheck,
  Users,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';

export default function VendorBookingManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  
  // Services state
  const [serviceTypes, setServiceTypes] = useState<BookingServiceType[]>([]);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<BookingServiceType | null>(null);
  const [savingService, setSavingService] = useState(false);
  
  // Availability state
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  
  // Slots state
  const [slots, setSlots] = useState<BookingTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Reservations state
  const [reservations, setReservations] = useState<BookingReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<BookingReservation | null>(null);
  const [reservationPanelOpen, setReservationPanelOpen] = useState(false);

  // Categories for service form
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; category_id: string }[]>([]);

  // Fetch vendor profile
  const fetchVendorProfile = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vendor profile:', error);
      toast({ title: 'Error', description: 'Could not load vendor profile.', variant: 'destructive' });
      return;
    }

    if (data) {
      setVendorId(data.id);
    }
  }, [user, toast]);

  // Fetch service types
  const fetchServiceTypes = useCallback(async () => {
    if (!vendorId) return;
    
    const { data, error } = await supabase
      .from('booking_service_types')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('name');

    if (error) {
      console.error('Error fetching service types:', error);
    } else {
      setServiceTypes((data as BookingServiceType[]) || []);
    }
  }, [vendorId]);

  // Fetch availability
  const fetchAvailability = useCallback(async () => {
    if (!vendorId) return;
    
    const { data, error } = await supabase
      .from('booking_availability')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching availability:', error);
    } else {
      setAvailability((data as BookingAvailability[]) || []);
    }
  }, [vendorId]);

  // Fetch slots
  const fetchSlots = useCallback(async () => {
    if (!vendorId) return;
    
    setLoadingSlots(true);
    const { data, error } = await supabase
      .from('booking_time_slots')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('slot_date', format(new Date(), 'yyyy-MM-dd'))
      .order('slot_date')
      .order('slot_start');

    if (error) {
      console.error('Error fetching slots:', error);
    } else {
      setSlots((data as BookingTimeSlot[]) || []);
    }
    setLoadingSlots(false);
  }, [vendorId]);

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    if (!vendorId) return;
    
    const { data, error } = await supabase
      .from('booking_reservations')
      .select(`
        *,
        service_type:booking_service_types(*)
      `)
      .eq('vendor_id', vendorId)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (error) {
      console.error('Error fetching reservations:', error);
    } else {
      setReservations((data as BookingReservation[]) || []);
    }
  }, [vendorId]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!vendorId) return;
    
    const { data: catData } = await supabase
      .from('vendor_categories')
      .select('id, name, slug')
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    const { data: subData } = await supabase
      .from('vendor_subcategories')
      .select('id, name, category_id')
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    setCategories(catData || []);
    setSubcategories(subData || []);
  }, [vendorId]);

  // Initial load
  useEffect(() => {
    fetchVendorProfile();
  }, [fetchVendorProfile]);

  // Load data when vendor ID is available
  useEffect(() => {
    if (vendorId) {
      Promise.all([
        fetchServiceTypes(),
        fetchAvailability(),
        fetchSlots(),
        fetchReservations(),
        fetchCategories(),
      ]).finally(() => setLoading(false));
    }
  }, [vendorId, fetchServiceTypes, fetchAvailability, fetchSlots, fetchReservations, fetchCategories]);

  // Service CRUD
  const handleSaveService = async (data: Partial<BookingServiceType>) => {
    if (!vendorId) return;
    
    setSavingService(true);
    try {
      if (editingService) {
        const { error } = await supabase
          .from('booking_service_types')
          .update(data)
          .eq('id', editingService.id);

        if (error) throw error;
        toast({ title: 'Service updated successfully' });
      } else {
        const { error } = await (supabase as any)
          .from('booking_service_types')
          .insert([{ ...data, vendor_id: vendorId }]);

        if (error) throw error;
        toast({ title: 'Service created successfully' });
      }
      
      fetchServiceTypes();
      setEditingService(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    const { error } = await supabase
      .from('booking_service_types')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Service deleted' });
      fetchServiceTypes();
    }
  };

  // Save availability
  const handleSaveAvailability = async (data: Partial<BookingAvailability>[]) => {
    if (!vendorId) return;
    
    setSavingAvailability(true);
    try {
      // Upsert all availability records
      for (const item of data) {
        const { error } = await supabase
          .from('booking_availability')
          .upsert(
            { ...item, vendor_id: vendorId },
            { onConflict: 'vendor_id,day_of_week' }
          );

        if (error) throw error;
      }
      
      toast({ title: 'Availability saved successfully' });
      fetchAvailability();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingAvailability(false);
    }
  };

  // Generate slots
  const handleGenerateSlots = async (startDate: Date, endDate: Date) => {
    if (!vendorId || availability.length === 0 || serviceTypes.length === 0) {
      toast({ 
        title: 'Setup Required', 
        description: 'Please set up your availability and create at least one service first.',
        variant: 'destructive' 
      });
      return;
    }

    try {
      // Use first service's duration as default
      const defaultDuration = serviceTypes[0]?.duration_minutes || 60;
      const newSlots = generateSlotsForDateRange(startDate, endDate, availability, defaultDuration);
      
      // Filter out slots that already exist
      const existingDates = new Set(slots.map(s => `${s.slot_date}-${s.slot_start}`));
      const slotsToInsert = newSlots
        .filter(s => !existingDates.has(`${s.slot_date}-${s.slot_start}`))
        .map(s => ({ ...s, vendor_id: vendorId }));

      if (slotsToInsert.length === 0) {
        toast({ title: 'No new slots to generate', description: 'Slots already exist for this period.' });
        return;
      }

      const { error } = await supabase
        .from('booking_time_slots')
        .insert(slotsToInsert);

      if (error) throw error;
      
      toast({ title: `Generated ${slotsToInsert.length} new slots` });
      fetchSlots();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Toggle slot block
  const handleToggleSlotBlock = async (slotId: string, blocked: boolean) => {
    const { error } = await supabase
      .from('booking_time_slots')
      .update({ is_blocked: blocked })
      .eq('id', slotId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchSlots();
    }
  };

  // Update reservation status
  const handleUpdateReservationStatus = async (id: string, status: BookingStatus, vendorNotes?: string) => {
    const updates: Partial<BookingReservation> = { status };
    if (vendorNotes !== undefined) {
      updates.vendor_notes = vendorNotes;
    }

    const { error } = await supabase
      .from('booking_reservations')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Booking updated' });
      fetchReservations();
      setReservationPanelOpen(false);
    }
  };

  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Booking Management</h1>
            <p className="text-sm text-muted-foreground">Manage services, availability, and bookings</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="services" className="gap-2">
              <CalendarCheck className="h-4 w-4 hidden sm:block" />
              Services
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2">
              <Clock className="h-4 w-4 hidden sm:block" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="slots" className="gap-2">
              <Calendar className="h-4 w-4 hidden sm:block" />
              Slots
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2 relative">
              <Users className="h-4 w-4 hidden sm:block" />
              Bookings
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Service Types</h3>
              <Button onClick={() => { setEditingService(null); setServiceFormOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </div>

            {serviceTypes.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-semibold mb-2">No Services Yet</h4>
                <p className="text-muted-foreground mb-4">Create your first booking service to get started.</p>
                <Button onClick={() => setServiceFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map(service => (
                  <Card key={service.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{service.name}</h4>
                        {service.category && (
                          <Badge variant="secondary" className="mt-1">{service.category}</Badge>
                        )}
                      </div>
                      <Badge variant={service.is_active ? 'default' : 'outline'}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>{DURATION_OPTIONS.find(d => d.value === service.duration_minutes)?.label || `${service.duration_minutes} min`}</span>
                      <span className="font-semibold text-foreground">KES {service.price.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setEditingService(service); setServiceFormOpen(true); }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hours Tab */}
          <TabsContent value="hours">
            <BookingAvailabilityScheduler
              availability={availability}
              onSave={handleSaveAvailability}
              loading={savingAvailability}
            />
          </TabsContent>

          {/* Slots Tab */}
          <TabsContent value="slots">
            <BookingSlotCalendar
              slots={slots}
              serviceTypes={serviceTypes}
              onGenerateSlots={handleGenerateSlots}
              onToggleSlotBlock={handleToggleSlotBlock}
              loading={loadingSlots}
            />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Bookings</h3>
            
            {reservations.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-semibold mb-2">No Bookings Yet</h4>
                <p className="text-muted-foreground">Your customer bookings will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {reservations.map(reservation => {
                  const statusInfo = BOOKING_STATUS_LABELS[reservation.status];
                  return (
                    <Card 
                      key={reservation.id} 
                      className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => { setSelectedReservation(reservation); setReservationPanelOpen(true); }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{reservation.service_type?.name || 'Service'}</h4>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{format(new Date(reservation.booking_date), 'MMM d, yyyy')}</span>
                            <span>{reservation.booking_time}</span>
                            <span className="font-medium text-foreground">KES {reservation.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Service Form Dialog */}
      <BookingServiceForm
        open={serviceFormOpen}
        onOpenChange={setServiceFormOpen}
        service={editingService}
        categories={categories}
        subcategories={subcategories}
        onSubmit={handleSaveService}
        loading={savingService}
      />

      {/* Reservation Panel */}
      <BookingReservationPanel
        reservation={selectedReservation}
        open={reservationPanelOpen}
        onOpenChange={setReservationPanelOpen}
        onUpdateStatus={handleUpdateReservationStatus}
      />
    </div>
  );
}
