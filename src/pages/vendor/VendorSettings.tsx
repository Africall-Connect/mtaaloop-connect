import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Lock, Globe, Moon, Trash, Store, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface VendorProfile {
  business_name: string;
  business_type: string;
  business_description: string;
  business_phone: string;
  business_address: string;
  estate_id: string | null;
}

const VendorSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('business_name, business_type, business_description, business_phone, business_address, estate_id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // fetchProfile is defined above (lines 37-57)

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          business_name: profile.business_name,
          business_type: profile.business_type,
          business_description: profile.business_description,
          business_phone: profile.business_phone,
          business_address: profile.business_address,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your business information has been updated.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving settings",
        description: "Could not update your business information.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/vendor/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">⚙️ Vendor Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Business Information */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Store className="h-5 w-5" />
              Business Information
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={profile?.business_name || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, business_name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    value={profile?.business_type || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, business_type: e.target.value } : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={profile?.business_phone || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, business_phone: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="businessAddress">Business Address</Label>
                <Input
                  id="businessAddress"
                  value={profile?.business_address || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, business_address: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={profile?.business_description || ""}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, business_description: e.target.value } : null)}
                  placeholder="Tell customers about your business..."
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
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
                  <p className="font-medium">Order Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new orders
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Review Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new reviews
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when products are low in stock
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Toggle dark theme
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Account */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-4 border-destructive/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-destructive">
              <Trash className="h-5 w-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              These actions cannot be undone. Please be certain.
            </p>
            <Button variant="destructive" className="w-full">
              Delete Business Account
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorSettings;
