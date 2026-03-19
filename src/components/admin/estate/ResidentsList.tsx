import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ResidentsListProps {
  estateId: string | undefined;
}

const ResidentsList: React.FC<ResidentsListProps> = ({ estateId }) => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['estate-users', estateId],
    queryFn: async () => {
      // Use delivery_addresses to find users linked to this estate
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('user_id, label, building_name, unit_number')
        .eq('estate_id', estateId!)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!estateId,
  });

  if (isLoading) return <div>Loading residents...</div>;
  if (!users || users.length === 0) return <div>No residents found.</div>;

  return (
    <div className="space-y-3">
      {users.map((u, i) => (
        <div key={i} className="p-3 border rounded flex items-center justify-between">
          <div>
            <div className="font-semibold">{u.label}</div>
            <div className="text-sm text-muted-foreground">
              {[u.building_name, u.unit_number].filter(Boolean).join(', ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResidentsList;
