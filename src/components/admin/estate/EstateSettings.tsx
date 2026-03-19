import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EstateSettingsProps {
  estateId?: string;
}

const EstateSettings: React.FC<EstateSettingsProps> = ({ estateId }) => {
  const { id } = useParams<{ id: string }>();
  const resolvedId = estateId || id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    contact_email: '',
    contact_phone: '',
    total_units: 0,
    is_active: true,
  });

  const { data: estate, isLoading } = useQuery({
    queryKey: ['estate-settings', resolvedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estates')
        .select('contact_email, contact_phone, total_units, is_active')
        .eq('id', resolvedId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!resolvedId,
  });

  useEffect(() => {
    if (estate) {
      setFormData({
        contact_email: estate.contact_email || '',
        contact_phone: estate.contact_phone || '',
        total_units: estate.total_units || 0,
        is_active: estate.is_active ?? true,
      });
    }
  }, [estate]);

  const updateMutation = useMutation({
    mutationFn: async (updates: typeof formData) => {
      const { error } = await supabase
        .from('estates')
        .update({
          contact_email: updates.contact_email,
          contact_phone: updates.contact_phone,
          total_units: updates.total_units,
          is_active: updates.is_active,
        })
        .eq('id', resolvedId!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate-settings', resolvedId] });
      queryClient.invalidateQueries({ queryKey: ['estate', resolvedId] });
      toast({ title: "Settings Updated", description: "Estate settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:gap-4 md:grid-cols-2">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <Label>Contact Email</Label>
              <Input type="email" value={formData.contact_email} onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))} />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input type="tel" value={formData.contact_phone} onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <Label>Total Units</Label>
              <Input type="number" value={formData.total_units} onChange={(e) => setFormData(prev => ({ ...prev, total_units: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
              <Label htmlFor="active">Estate Active</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
};

export default EstateSettings;
