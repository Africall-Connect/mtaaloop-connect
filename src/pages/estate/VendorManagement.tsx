import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Eye, CheckCircle, XCircle, Star } from 'lucide-react';
import { OperatingHours, ErrorResponse } from '@/types/common';

interface Vendor {
  id: string;
  business_name: string;
  business_type: string;
  description: string;
  phone: string;
  email: string;
  is_approved: boolean;
  rating: number;
  total_orders: number;
  total_revenue: number;
  created_at: string;
  categories: string[];
  operating_hours: OperatingHours;
}

interface VendorManagementProps {
  estateId: string;
}

export default function VendorManagement({ estateId }: VendorManagementProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vendor_profiles')
        .select('*')
        .eq('estate_id', estateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors((data as any) || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  }, [estateId]);

  useEffect(() => {
    fetchVendors();
  }, [estateId, fetchVendors]);

  const approveVendor = async (vendorId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('vendor_profiles')
        .update({ is_approved: true })
        .eq('id', vendorId);

      if (error) throw error;
      toast.success('Vendor approved');
      fetchVendors();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to approve vendor:', err);
      toast.error('Failed to approve vendor');
    }
  };

  const rejectVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to reject this vendor?')) return;

    try {
      const { error } = await (supabase as any)
        .from('vendor_profiles')
        .update({ is_approved: false })
        .eq('id', vendorId);

      if (error) throw error;
      toast.success('Vendor rejected');
      fetchVendors();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Failed to reject vendor:', err);
      toast.error('Failed to reject vendor');
    }
  };

  const pendingVendors = vendors.filter(v => !v.is_approved);
  const approvedVendors = vendors.filter(v => v.is_approved);

  if (loading) {
    return <div className="text-center py-8">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vendor Management</h2>

      {pendingVendors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals ({pendingVendors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.business_name}</TableCell>
                    <TableCell>{vendor.business_type}</TableCell>
                    <TableCell>{vendor.phone}</TableCell>
                    <TableCell>{new Date(vendor.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedVendor(vendor)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{vendor.business_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Business Type</Label>
                                  <p className="text-sm text-muted-foreground">{vendor.business_type}</p>
                                </div>
                                <div>
                                  <Label>Phone</Label>
                                  <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p className="text-sm text-muted-foreground">{vendor.email}</p>
                                </div>
                                <div>
                                  <Label>Categories</Label>
                                  <div className="flex flex-wrap gap-1">
                                    {vendor.categories?.map((cat, idx) => (
                                      <Badge key={idx} variant="secondary">{cat}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label>Description</Label>
                                <p className="text-sm text-muted-foreground">{vendor.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => approveVendor(vendor.id)} className="flex-1">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button variant="destructive" onClick={() => rejectVendor(vendor.id)} className="flex-1">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
          <CardTitle>Approved Vendors ({approvedVendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedVendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.business_name}</TableCell>
                    <TableCell>{vendor.business_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{vendor.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{vendor.total_orders || 0}</TableCell>
                    <TableCell>KES {vendor.total_revenue?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedVendor(vendor)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{vendor.business_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Business Type</Label>
                                <p className="text-sm text-muted-foreground">{vendor.business_type}</p>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm text-muted-foreground">{vendor.email}</p>
                              </div>
                              <div>
                                <Label>Rating</Label>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{vendor.rating?.toFixed(1) || '0.0'}</span>
                                </div>
                              </div>
                              <div>
                                <Label>Total Orders</Label>
                                <p className="text-sm text-muted-foreground">{vendor.total_orders || 0}</p>
                              </div>
                              <div>
                                <Label>Total Revenue</Label>
                                <p className="text-sm text-muted-foreground">KES {vendor.total_revenue?.toLocaleString() || '0'}</p>
                              </div>
                            </div>
                            <div>
                              <Label>Categories</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {vendor.categories?.map((cat, idx) => (
                                  <Badge key={idx} variant="secondary">{cat}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <p className="text-sm text-muted-foreground">{vendor.description}</p>
                            </div>
                            <Button variant="destructive" onClick={() => rejectVendor(vendor.id)} className="w-full">
                              <XCircle className="h-4 w-4 mr-2" />
                              Remove Vendor
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No approved vendors yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
