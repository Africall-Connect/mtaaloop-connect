import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileUploadZone } from '@/components/estate/FileUploadZone';
import { AmenityPicker } from '@/components/estate/AmenityPicker';
import { MapSelector } from '@/components/estate/MapSelector';
import { Save, Loader2 } from 'lucide-react';
import { OperatingHours, ErrorResponse } from '@/types/common';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
}

interface EstateProfile {
  id: string;
  name: string;
  location: string;
  description: string;
  total_units: number;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  estate_type: string;
  contact_phone: string;
  contact_email: string;
  website_url: string;
  operating_hours: OperatingHours;
  images: string[];
}

const ESTATE_TYPES = [
  { value: 'apartment_complex', label: 'Apartment Complex' },
  { value: 'gated_community', label: 'Gated Community' },
  { value: 'residential_estate', label: 'Residential Estate' },
  { value: 'mixed_use_development', label: 'Mixed-Use Development' },
  { value: 'townhouse_complex', label: 'Townhouse Complex' },
  { value: 'condominiums', label: 'Condominiums' }
];

export default function EstateProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<EstateProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    total_units: 0,
    latitude: '',
    longitude: '',
    amenities: [] as string[],
    estate_type: '',
    contact_phone: '',
    contact_email: '',
    website_url: '',
    operating_hours: {
      start: '06:00',
      end: '23:00'
    },
    images: [] as UploadedFile[]
  });

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('estates')
        .select('*')
        .eq('approved_by', user?.id)
        .single();

      if (error) throw error;

      setProfile(data as any);
      setFormData({
        name: data.name || '',
        location: data.location || '',
        description: data.description || '',
        total_units: data.total_units || 0,
        latitude: '',
        longitude: '',
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        estate_type: data.estate_type || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        website_url: '',
        operating_hours: { start: '06:00', end: '23:00' },
        images: data.estate_photos || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load estate profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        total_units: formData.total_units,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        amenities: formData.amenities,
        estate_type: formData.estate_type,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        website_url: formData.website_url,
        operating_hours: formData.operating_hours,
        images: formData.images
      };

      const { error } = await supabase
        .from('estates')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Estate profile updated successfully');
      fetchProfile();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Error updating profile:', err);
      toast.error('Failed to update estate profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      location: location.address
    }));
  };

  const handleAmenitiesChange = (amenities: string[]) => {
    setFormData(prev => ({ ...prev, amenities }));
  };

  const handleImagesChange = (files: UploadedFile[]) => {
    setFormData(prev => ({ ...prev, images: files }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Estate profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Estate Profile</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Estate Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="estate_type">Estate Type</Label>
                <Select
                  value={formData.estate_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, estate_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select estate type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="total_units">Total Units</Label>
                <Input
                  id="total_units"
                  type="number"
                  value={formData.total_units}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_units: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="website_url">Website</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your estate..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_phone">Phone Number</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+254 XXX XXX XXX"
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Email Address</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contact@estate.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <MapSelector
              onLocationSelect={handleLocationSelect}
              initialLatitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
              initialLongitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
              initialAddress={formData.location}
            />
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <AmenityPicker
              selectedAmenities={formData.amenities}
              onChange={handleAmenitiesChange}
            />
          </CardContent>
        </Card>

        {/* Estate Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Estate Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              acceptedFileTypes="image/*"
              maxFiles={10}
              maxSizeMB={5}
              title="Estate Photos"
              description="Upload photos of your estate (max 10 files, 5MB each)"
              onFilesChange={handleImagesChange}
              existingFiles={formData.images}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
