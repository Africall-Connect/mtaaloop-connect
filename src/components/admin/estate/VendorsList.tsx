import React from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface VendorsListProps {
  estateId: string | undefined;
}

const VendorsList: React.FC<VendorsListProps> = ({ estateId }) => {
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors', estateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, slug, is_active, is_approved, created_at')
        .eq('estate_id', estateId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!estateId,
  });

  const toggleMutation = useMutation({
    mutationFn: async (payload: { vendorId: string; active: boolean }) => {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ is_active: payload.active })
        .eq('id', payload.vendorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', estateId] });
    },
  });

  if (isLoading) return <div>Loading vendors...</div>;
  if (!vendors || vendors.length === 0) return <div>No vendors found for this estate.</div>;

  return (
    <div className="space-y-3">
      {vendors.map((v) => (
        <div key={v.id} className="p-3 border rounded flex items-center justify-between">
          <div>
            <div className="font-semibold">{v.business_name}</div>
            <div className="text-sm text-muted-foreground">{v.slug}</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={v.is_active ? 'destructive' : 'default'}
              size="sm"
              onClick={() => toggleMutation.mutate({ vendorId: v.id, active: !v.is_active })}
            >
              {v.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VendorsList;
