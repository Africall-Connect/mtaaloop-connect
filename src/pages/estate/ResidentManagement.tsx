import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ErrorResponse } from '@/types/common';

interface Resident {
  id: string;
  user_id: string;
  apartment_number: string;
  is_approved: boolean;
  created_at: string;
}

interface ResidentManagementProps {
  estateId: string;
}

export default function ResidentManagement({ estateId }: ResidentManagementProps) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResidents = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('estate_residents')
        .select('*')
        .eq('estate_id', estateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResidents((data as any) || []);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  }, [estateId]);

  useEffect(() => {
    fetchResidents();
  }, [estateId, fetchResidents]);

  const approveResident = async (residentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('estate_residents')
        .update({ is_approved: true })
        .eq('id', residentId);

      if (error) throw error;
      toast.success('Resident approved');
      fetchResidents();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to approve resident:', err);
      toast.error('Failed to approve resident');
    }
  };

  const removeResident = async (residentId: string) => {
    if (!confirm('Are you sure you want to remove this resident?')) return;

    try {
      const { error } = await (supabase as any)
        .from('estate_residents')
        .delete()
        .eq('id', residentId);

      if (error) throw error;
      toast.success('Resident removed');
      fetchResidents();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to remove resident:', err);
      toast.error('Failed to remove resident');
    }
  };

  const pendingResidents = residents.filter(r => !r.is_approved);
  const approvedResidents = residents.filter(r => r.is_approved);

  if (loading) {
    return <div className="text-center py-8">Loading residents...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Resident Management</h2>

      {pendingResidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals ({pendingResidents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingResidents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">{resident.apartment_number}</TableCell>
                    <TableCell>{new Date(resident.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveResident(resident.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeResident(resident.id)}>
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Approved Residents ({approvedResidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedResidents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedResidents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">{resident.apartment_number}</TableCell>
                    <TableCell>
                      <Badge>Active</Badge>
                    </TableCell>
                    <TableCell>{new Date(resident.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => removeResident(resident.id)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No approved residents yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
