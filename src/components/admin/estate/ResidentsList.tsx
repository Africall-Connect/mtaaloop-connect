import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Resident {
  id: string;
  name: string;
  email?: string;
  apartment?: string;
  created_at?: string;
}

interface ResidentsListProps {
  estateId: string | undefined;
}

const ResidentsList: React.FC<ResidentsListProps> = ({ estateId }) => {
  const queryClient = useQueryClient();

  const { data: residents, isLoading } = useQuery({
    queryKey: ['residents', estateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('estate_id', estateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Resident[];
    },
    enabled: !!estateId,
  });

  const removeMutation = useMutation<void, Error, string>(
    async (residentId: string) => {
      const { error } = await supabase
        .from('residents')
        .delete()
        .eq('id', residentId);
      if (error) throw error;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['residents', estateId] });
        queryClient.invalidateQueries({ queryKey: ['estate', estateId] });
      },
    }
  );

  if (isLoading) return <div>Loading residents...</div>;
  if (!residents || residents.length === 0) return <div>No residents found.</div>;

  return (
    <div className="space-y-3">
      {residents.map((r) => (
        <div key={r.id} className="p-3 border rounded flex items-center justify-between">
          <div>
            <div className="font-semibold">{r.name}</div>
            <div className="text-sm text-muted-foreground">{r.email || r.apartment}</div>
          </div>
          <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeMutation.mutate(r.id)}
                disabled={removeMutation.status === 'loading'}
              >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResidentsList;
