import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TermsAgreementCheckbox } from "@/components/TermsAgreementCheckbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Estate, ErrorResponse } from "@/types/common";

const RiderSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    idNumber: "",
    vehicleType: "",
    vehicleRegistration: "",
    licenseNumber: "",
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

      // Create rider profile (role will be auto-assigned by database trigger)
      const { error: profileError } = await supabase
        .from("rider_profiles")
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          id_number: formData.idNumber,
          vehicle_type: formData.vehicleType,
          vehicle_registration: formData.vehicleRegistration || null,
          license_number: formData.licenseNumber || null,
          estate_id: formData.estateId || null,
          is_approved: false,
        });

      if (profileError) throw profileError;

      toast.success("Rider application submitted successfully!");
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
          <CardTitle>Rider Registration</CardTitle>
          <CardDescription>Join MtaaLoop as a delivery rider and start earning</CardDescription>
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
              <div>
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  required
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Vehicle Information</h3>
              <div>
                <Label htmlFor="estate">Primary Estate (Optional)</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, estateId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select estate you'll operate in" />
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
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.vehicleType === "motorcycle" || formData.vehicleType === "car") && (
                <>
                  <div>
                    <Label htmlFor="vehicleRegistration">Vehicle Registration Number</Label>
                    <Input
                      id="vehicleRegistration"
                      value={formData.vehicleRegistration}
                      onChange={(e) => setFormData({ ...formData, vehicleRegistration: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">Driver's License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <TermsAgreementCheckbox
              checked={agreedToTerms}
              onCheckedChange={setAgreedToTerms}
            >
              I agree to the terms and conditions
            </TermsAgreementCheckbox>
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

export default RiderSignup;
