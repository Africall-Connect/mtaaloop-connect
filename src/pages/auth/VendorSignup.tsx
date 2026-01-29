import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Estate, ErrorResponse } from "@/types/common";

const VendorSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [locationInEstate, setLocationInEstate] = useState<string>("inside");
  const [estates, setEstates] = useState<Estate[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    businessType: "",
    businessDescription: "",
    businessPhone: "",
    businessAddress: "",
    estateId: "",
  });

  useEffect(() => {
    fetchEstates();
  }, []);

  const fetchEstates = async () => {
    const { data, error } = await supabase
      .from('estates')
      .select('id, name, location, county')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching estates:', error);
    } else {
      console.log("Fetched estates:", data);
      setEstates(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Create vendor profile (role will be auto-assigned by database trigger)
      const slug = formData.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error: profileError } = await supabase
        .from("vendor_profiles")
        .insert({
          user_id: authData.user.id,
          business_name: formData.businessName,
          business_type: formData.businessType,
          business_description: formData.businessDescription,
          business_phone: formData.businessPhone,
          business_address: formData.businessAddress,
          slug: slug,
          estate_id: locationInEstate === "inside" && formData.estateId ? formData.estateId : null,
          is_approved: false,
        });

      if (profileError) throw profileError;

      toast.success("Vendor application submitted successfully!");
      navigate("/pending-approval");
    } catch (error) {
      const err = error as ErrorResponse;
      toast.error(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Vendor Registration</CardTitle>
          <CardDescription>Join MtaaLoop as a vendor and grow your business</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Business Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-background border shadow-lg z-50">
                      {/* Inventory Categories */}
                      <SelectItem value="food-drinks">Food & Drinks</SelectItem>
                      <SelectItem value="living-essentials">Living Essentials</SelectItem>
                      <SelectItem value="groceries-food">Groceries & Food</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      {/* Service Categories */}
                      <SelectItem value="utilities-services">Utilities & Services</SelectItem>
                      <SelectItem value="home-services">Home Services</SelectItem>
                      {/* Booking Categories */}
                      <SelectItem value="beauty-spa">Beauty & Spa</SelectItem>
                      <SelectItem value="accommodation">Accommodation</SelectItem>
                      {/* Pharmacy (Hybrid) */}
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  required
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label>Business Location</Label>
                <RadioGroup value={locationInEstate} onValueChange={setLocationInEstate}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inside" id="inside" />
                    <Label htmlFor="inside" className="font-normal cursor-pointer">
                      Inside an Estate/Apartment Complex
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outside" id="outside" />
                    <Label htmlFor="outside" className="font-normal cursor-pointer">
                      Outside (Street/Commercial Location)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {locationInEstate === "inside" ? (
                <div>
                  <Label htmlFor="estate">Select Estate</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, estateId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your estate" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {estates.map((estate) => (
                        <SelectItem key={estate.id} value={estate.id}>
                          {estate.name} - {estate.location}, {estate.county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    required
                    placeholder="Enter street address, building, area"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  placeholder="Tell us about your business..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                I agree to the terms and conditions
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default VendorSignup;
