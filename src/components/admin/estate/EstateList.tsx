import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

interface Estate {
  id: string;
  name: string;
  location: string;
  status: string;
  created_at: string;
}

export const EstateList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: estates, isLoading } = useQuery({
    queryKey: ['estates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estates')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Estate[];
    },
  });

  useEffect(() => {
    // subscribe to estate changes and invalidate cache when any change happens
    const channel = supabase
      .channel('public:estates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estates' }, () => {
        queryClient.invalidateQueries({ queryKey: ['estates'] });
      })
      .subscribe();

    return () => {
      try { channel.unsubscribe(); } catch (e) { /* ignore */ }
      try { supabase.removeChannel?.(channel); } catch (e) { /* ignore */ }
    };
  }, [queryClient]);

  if (isLoading) return <div>Loading estates...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {estates?.map((estate) => (
        <Card
          key={estate.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/admin/estates/${estate.id}`)}
        >
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{estate.name}</h3>
            <p className="text-sm text-gray-600">{estate.location}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className={`px-2 py-1 rounded-full text-xs ${
                estate.status === 'active' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {estate.status}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
