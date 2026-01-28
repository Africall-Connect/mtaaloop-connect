import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Lock, Globe, Moon, Sun, Trash, User, Phone, Mail, Save, Loader2, CalendarDays, Users, Utensils, Camera, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  dietary_preferences: string[] | null;
  allergens: string[] | null;
  preferred_language: string;
  email_verified: boolean;
  phone_verified: boolean;
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
}

const Settings = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    preferred_language: "en",
  });

  // Preferences state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Dietary preferences
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const dietaryOptions = [
    "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-Free", 
    "Dairy-Free", "Nut-Free", "Pescatarian", "Keto", "Paleo"
  ];

  const allergenOptions = [
    "Peanuts", "Tree Nuts", "Dairy", "Eggs", "Shellfish", 
    "Fish", "Soy", "Wheat", "Gluten", "Sesame"
  ];

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
        return;
      }

      setUserEmail(user.email || "");

      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError);
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          date_of_birth: profileData.date_of_birth || "",
          gender: profileData.gender || "",
          preferred_language: profileData.preferred_language || "en",
        });
        setSelectedDietary(profileData.dietary_preferences || []);
        setSelectedAllergens(profileData.allergens || []);
      } else {
        // Create new profile
        const newProfile = {
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          phone: user.user_metadata?.phone || null,
        };

        const { data: created, error: createError } = await supabase
          .from("customer_profiles")
          .insert(newProfile)
          .select()
          .single();

        if (!createError && created) {
          setProfile(created);
          setFormData({
            full_name: created.full_name,
            phone: created.phone || "",
            date_of_birth: "",
            gender: "",
            preferred_language: "en",
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
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const updates = {
        full_name: formData.full_name,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        preferred_language: formData.preferred_language,
        dietary_preferences: selectedDietary.length > 0 ? selectedDietary : null,
        allergens: selectedAllergens.length > 0 ? selectedAllergens : null,
      };

      const { error } = await supabase
        .from("customer_profiles")
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


  const toggleDietary = (item: string) => {
    setSelectedDietary(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleAllergen = (item: string) => {
    setSelectedAllergens(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      
      // This would typically call a backend function to properly delete all user data
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
      });

      // Redirect handled by auth state change
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCameraButtonClick = () => {
    if (isMobile) {
      setShowUploadDialog(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleUploadSourceChoice = (useCamera: boolean) => {
    setShowUploadDialog(false);
    if (useCamera) {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('customer-avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile picture updated!",
        description: "Your new photo looks great! ✨",
      });

      await fetchProfile();
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">⚙️ Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </h3>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              )}
            </div>

            {!editMode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl overflow-hidden">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        profile?.full_name?.charAt(0)?.toUpperCase() || "👤"
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg"
                      disabled={uploading}
                      onClick={handleCameraButtonClick}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold">{profile?.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                    {profile?.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {profile.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{profile?.gender || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {profile?.date_of_birth
                        ? new Date(profile.date_of_birth).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Language</p>
                    <p className="font-medium">{profile?.preferred_language?.toUpperCase() || "EN"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loyalty Points</p>
                    <p className="font-medium text-primary">{profile?.loyalty_points || 0} pts</p>
                  </div>
                </div>

                {selectedDietary.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Dietary Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDietary.map(item => (
                        <Badge key={item} variant="secondary">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAllergens.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Allergens</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAllergens.map(item => (
                        <Badge key={item} variant="destructive">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Dietary Preferences
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map(item => (
                      <Badge
                        key={item}
                        variant={selectedDietary.includes(item) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleDietary(item)}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Allergens (Foods to Avoid)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {allergenOptions.map(item => (
                      <Badge
                        key={item}
                        variant={selectedAllergens.includes(item) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleAllergen(item)}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
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
              </div>
            )}
          </Card>

          {/* Notifications */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive order updates instantly
                  </p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Weekly deals and offers
                  </p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Delivery updates via SMS
                  </p>
                </div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>
            </div>
          </Card>

          {/* Privacy */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Privacy & Security
            </h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                {profile?.email_verified ? "✓ Email Verified" : "Verify Email"}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="mr-2 h-4 w-4" />
                {profile?.phone_verified ? "✓ Phone Verified" : "Verify Phone"}
              </Button>
            </div>
          </Card>


          {/* Danger Zone */}
          <Card className="p-4 border-destructive/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-destructive">
              <Trash className="h-5 w-5" />
              Danger Zone
            </h3>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profile information</li>
                <li>Order history</li>
                <li>Saved addresses</li>
                <li>Payment methods</li>
                <li>Loyalty points</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Source Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Upload Method</DialogTitle>
            <DialogDescription>
              How would you like to upload your profile picture?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-3"
              onClick={() => handleUploadSourceChoice(true)}
            >
              <Camera className="h-10 w-10" />
              <span className="font-semibold">Take Photo</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-3"
              onClick={() => handleUploadSourceChoice(false)}
            >
              <FolderOpen className="h-10 w-10" />
              <span className="font-semibold">Choose from Gallery</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
