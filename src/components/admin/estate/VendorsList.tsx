import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Vendor {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
  is_approved?: boolean;
  created_at?: string;
}

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
        .select('*')
        .eq('estate_id', estateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Vendor[];
    },
    enabled: !!estateId,
  });

const toggleMutation = useMutation({
    mutationFn: async (payload: { vendorId: string; active: boolean }) => {
      const { vendorId, active } = payload;
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ is_active: active })
        .eq('id', vendorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', estateId] });
      queryClient.invalidateQueries({ queryKey: ['estate', estateId] });
    },
  });

  if (isLoading) return <div>Loading vendors...</div>;
  if (!vendors || vendors.length === 0) return <div>No vendors found for this estate.</div>;

  return (
    <div className="space-y-3">
      {vendors.map((v) => (
        <div key={v.id} className="p-3 border rounded flex items-center justify-between">
          <div>
            <div className="font-semibold">{v.name}</div>
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
