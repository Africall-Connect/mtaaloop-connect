import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EstateSettings {
  operating_hours: {
    start: string;
    end: string;
  };
  delivery_fees: {
    base: number;
    per_km: number;
  };
  settings: {
    requires_approval: boolean;
    allows_cod: boolean;
    min_order: number;
  };
}

const EstateSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for form values
  const [settings, setSettings] = useState<EstateSettings>({
    operating_hours: {
      start: "09:00",
      end: "17:00"
    },
    delivery_fees: {
      base: 0,
      per_km: 0
    },
    settings: {
      requires_approval: false,
      allows_cod: true,
      min_order: 0
    }
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['estate-settings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estates')
        .select('operating_hours, delivery_fees, settings')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EstateSettings;
    },
    onSuccess: (data) => {
      if (data) {
        setSettings(data);
      }
    }
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: EstateSettings) => {
      const { error } = await supabase
        .from('estates')
        .update({
          operating_hours: newSettings.operating_hours,
          delivery_fees: newSettings.delivery_fees,
          settings: newSettings.settings
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate-settings', id] });
      queryClient.invalidateQueries({ queryKey: ['estate', id] });
      toast({
        title: "Settings Updated",
        description: "Estate settings have been successfully updated."
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update estate settings.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Ensure grid stacks well on mobile with proper gap and single column */}
  <div className="grid gap-6 sm:gap-4 md:grid-cols-2">
    {/* Operating Hours */}
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Operating Hours</h3>
      <div className="space-y-4">
        <div>
          <Label>Opening Time</Label>
          <Input
            type="time"
            value={settings.operating_hours.start}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              operating_hours: {
                ...prev.operating_hours,
                start: e.target.value
              }
            }))}
          />
        </div>
        <div>
          <Label>Closing Time</Label>
          <Input
            type="time"
            value={settings.operating_hours.end}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              operating_hours: {
                ...prev.operating_hours,
                end: e.target.value
              }
            }))}
          />
        </div>
      </div>
    </div>

        {/* Delivery Settings */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Delivery Settings</h3>
          <div className="space-y-4">
            <div>
              <Label>Base Delivery Fee (KES)</Label>
              <Input
                type="number"
                value={settings.delivery_fees.base}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  delivery_fees: {
                    ...prev.delivery_fees,
                    base: Number(e.target.value)
                  }
                }))}
              />
            </div>
            <div>
              <Label>Per KM Rate (KES)</Label>
              <Input
                type="number"
                value={settings.delivery_fees.per_km}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  delivery_fees: {
                    ...prev.delivery_fees,
                    per_km: Number(e.target.value)
                  }
                }))}
              />
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="approval"
                checked={settings.settings.requires_approval}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    requires_approval: checked
                  }
                }))}
              />
              <Label htmlFor="approval">Require Approval for New Residents</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="cod"
                checked={settings.settings.allows_cod}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    allows_cod: checked
                  }
                }))}
              />
              <Label htmlFor="cod">Allow Cash on Delivery</Label>
            </div>

            <div>
              <Label>Minimum Order Amount (KES)</Label>
              <Input
                type="number"
                value={settings.settings.min_order}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    min_order: Number(e.target.value)
                  }
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
};

export default EstateSettings;
