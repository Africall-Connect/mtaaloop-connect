import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useToast } from '../../hooks/use-toast';
import { ArrowLeft, Camera, Save, Loader2, Bike, Star, MapPin, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RiderProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  id_number: string;
  avatar_url: string | null;
  vehicle_type: string;
  license_number: string | null;
  vehicle_registration: string | null;
  emergency_contact: string | null;
  emergency_contact_phone: string | null;
  address: string | null;
  city: string | null;
  rating: number;
  total_deliveries: number;
  is_approved: boolean;
  created_at: string;
}

export default function RiderProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    vehicle_type: 'motorcycle',
    license_number: '',
    vehicle_registration: '',
    emergency_contact: '',
    emergency_contact_phone: '',
    address: '',
    city: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      // Fetch rider profile
      const { data: profileData, error: profileError } = await supabase
        .from("rider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      if (profileData) {
        setProfile(profileData as any);
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          vehicle_type: profileData.vehicle_type || 'motorcycle',
          license_number: profileData.license_number || '',
          vehicle_registration: profileData.vehicle_registration || '',
          emergency_contact: (profileData as any).emergency_contact || '',
          emergency_contact_phone: (profileData as any).emergency_contact_phone || '',
          address: (profileData as any).address || '',
          city: (profileData as any).city || '',
        });
      } else {
        // Create new profile if it doesn't exist
        const newProfile = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Rider",
          phone: user.user_metadata?.phone || "",
          email: user.email || null,
          id_number: "",
          vehicle_type: 'motorcycle',
        };

        const { data: created, error: createError } = await supabase
          .from("rider_profiles")
          .insert(newProfile)
          .select()
          .single();

        if (!createError && created) {
          setProfile(created as any);
          setFormData({
            full_name: created.full_name,
            phone: created.phone || '',
            vehicle_type: created.vehicle_type,
            license_number: '',
            vehicle_registration: '',
            emergency_contact: '',
            emergency_contact_phone: '',
            address: '',
            city: '',
          });
        } else if (createError) {
          console.error("Error creating profile:", createError);
          toast({
            title: "Error",
            description: "Failed to create profile",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProfile();
  }, [user, fetchProfile]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const updates = {
        full_name: formData.full_name,
        phone: formData.phone || null,
        vehicle_type: formData.vehicle_type,
        license_number: formData.license_number || null,
        vehicle_registration: formData.vehicle_registration || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        address: formData.address || null,
        city: formData.city || null,
      };

      const { error } = await supabase
        .from("rider_profiles")
        .update(updates)
        .eq("user_id", profile.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setEditMode(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rider/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Rider Profile</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "R"}
                  </AvatarFallback>
                </Avatar>
                {editMode && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{profile?.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{profile?.total_deliveries || 0} deliveries</span>
                  </div>
                  <Badge variant={profile?.is_approved ? "default" : "secondary"}>
                    {profile?.is_approved ? "Approved" : "Pending Approval"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  {profile?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {profile.phone}
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
              {!editMode && (
                <Button onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </Card>

          {/* Profile Details */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              {!editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="mt-1">{profile?.full_name || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="mt-1">{profile?.phone || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Vehicle Type</Label>
                    <p className="mt-1 capitalize">{profile?.vehicle_type || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">License Number</Label>
                    <p className="mt-1">{profile?.license_number || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Vehicle Registration</Label>
                    <p className="mt-1">{profile?.vehicle_registration || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">City</Label>
                    <p className="mt-1">{profile?.city || "Not set"}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+254 700 000 000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="bicycle">Bicycle</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      placeholder="DL123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_registration">Vehicle Registration</Label>
                    <Input
                      id="vehicle_registration"
                      value={formData.vehicle_registration}
                      onChange={(e) => setFormData({ ...formData, vehicle_registration: e.target.value })}
                      placeholder="KCB 123A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Nairobi"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Your full address"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              {!editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Contact Name</Label>
                    <p className="mt-1">{profile?.emergency_contact || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Contact Phone</Label>
                    <p className="mt-1">{profile?.emergency_contact_phone || "Not set"}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {editMode && (
            <div className="flex gap-4">
              <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
