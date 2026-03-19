import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ResidentsList from './ResidentsList.tsx';
import VendorsList from './VendorsList.tsx';
import EstateAnalytics from './EstateAnalytics.tsx';
import EstateSettings from './EstateSettings.tsx';

interface Estate {
  id: string;
  name: string;
  location: string;
  is_active: boolean | null;
  created_at: string;
  estate_type?: string | null;
  total_units?: number | null;
  county?: string | null;
  address?: string;
  postal_code?: string | null;
  description?: string | null;
  amenities?: any;
}

const KENYA_COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Garissa", "Kakamega", "Naivasha", "Nyeri", "Machakos", "Meru"];
const ESTATE_TYPES = [
  { value: "apartment_complex", label: "Apartment Complex" },
  { value: "gated_community", label: "Gated Community" },
  { value: "residential_estate", label: "Residential Estate" },
  { value: "mixed_use_development", label: "Mixed-Use Development" },
  { value: "townhouse_complex", label: "Townhouse Complex" },
  { value: "condominiums", label: "Condominiums" }
];

export const EstateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEstate, setEditedEstate] = useState<Partial<Estate>>({});
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: estate, isLoading } = useQuery({
    queryKey: ['estate', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estates')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as unknown as Estate;
    },
  });

  const handleStatusChange = async (newActive: boolean) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('estates')
        .update({ is_active: newActive })
        .eq('id', id!);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['estate', id] });
      queryClient.invalidateQueries({ queryKey: ['estates'] });

      toast({
        title: "Status Updated",
        description: `Estate has been ${newActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update estate status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveDetails = async () => {
    try {
      const { error } = await supabase
        .from('estates')
        .update(editedEstate as any)
        .eq('id', id!);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['estate', id] });
      queryClient.invalidateQueries({ queryKey: ['estates'] });

      toast({
        title: "Details Updated",
        description: "Estate details have been successfully updated.",
      });

      setIsEditing(false);
      setEditedEstate({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update estate details",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedEstate({});
  };

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`public:estates:id=${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estates', filter: `id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['estate', id] });
        queryClient.invalidateQueries({ queryKey: ['estates'] });
      })
      .subscribe();

    return () => {
      try { channel.unsubscribe(); } catch (e) { /* ignore */ }
      try { supabase.removeChannel?.(channel); } catch (e) { /* ignore */ }
    };
  }, [id, queryClient]);

  if (isLoading) return <div>Loading estate details...</div>;
  if (!estate) return <div>Estate not found</div>;

  const statusLabel = estate.is_active ? 'active' : 'inactive';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{estate.name}</h1>
          <p className="text-muted-foreground">{estate.location}</p>
        </div>
        <div className="flex gap-2">
          {estate.is_active ? (
            <Button
              variant="destructive"
              onClick={() => handleStatusChange(false)}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Updating...' : 'Deactivate Estate'}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => handleStatusChange(true)}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Updating...' : 'Activate Estate'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="overflow-x-auto no-scrollbar flex gap-2 border-b">
          <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="vendors" className="whitespace-nowrap">Vendors</TabsTrigger>
          <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="whitespace-nowrap">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Estate Details</h3>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveDetails}>Save</Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    {isEditing ? (
                      <Input id="name" value={editedEstate.name ?? estate.name} onChange={(e) => setEditedEstate(prev => ({ ...prev, name: e.target.value }))} />
                    ) : (
                      <p className="text-sm">{estate.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    {isEditing ? (
                      <Select value={editedEstate.estate_type ?? estate.estate_type ?? ""} onValueChange={(value) => setEditedEstate(prev => ({ ...prev, estate_type: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ESTATE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{estate.estate_type || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="units">Total Units</Label>
                    {isEditing ? (
                      <Input id="units" type="number" value={editedEstate.total_units ?? estate.total_units ?? ""} onChange={(e) => setEditedEstate(prev => ({ ...prev, total_units: Number(e.target.value) }))} />
                    ) : (
                      <p className="text-sm">{estate.total_units || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input id="location" value={editedEstate.location ?? estate.location} onChange={(e) => setEditedEstate(prev => ({ ...prev, location: e.target.value }))} />
                    ) : (
                      <p className="text-sm">{estate.location}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="county">County</Label>
                    {isEditing ? (
                      <Select value={editedEstate.county ?? estate.county ?? ""} onValueChange={(value) => setEditedEstate(prev => ({ ...prev, county: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {KENYA_COUNTIES.map(county => (
                            <SelectItem key={county} value={county}>{county}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{estate.county || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Input id="address" value={editedEstate.address ?? estate.address ?? ""} onChange={(e) => setEditedEstate(prev => ({ ...prev, address: e.target.value }))} />
                    ) : (
                      <p className="text-sm">{estate.address || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    {isEditing ? (
                      <Textarea id="description" value={editedEstate.description ?? estate.description ?? ""} onChange={(e) => setEditedEstate(prev => ({ ...prev, description: e.target.value }))} rows={2} />
                    ) : (
                      <p className="text-sm">{estate.description || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Estate Status</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Status:</span> <Badge variant={estate.is_active ? 'default' : 'secondary'}>{statusLabel}</Badge></p>
                  <p><span className="font-medium">Created:</span> {new Date(estate.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vendors">
          <VendorsList estateId={id} />
        </TabsContent>

        <TabsContent value="analytics">
          <EstateAnalytics />
        </TabsContent>

        <TabsContent value="settings">
          <EstateSettings estateId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
