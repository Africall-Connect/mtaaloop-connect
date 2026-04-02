import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Estate } from "@/types/common";
import { MtaaLoopLogo } from "@/components/MtaaLoopLogo";
import { CheckCircle, Store, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";

const vendorFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().regex(/^(\+254|07)\d{8,13}$/, "Enter a valid Kenyan phone number"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  businessName: z.string().trim().min(2, "Business name is required"),
  businessType: z.string().min(1, "Select a business type"),
  businessDescription: z.string().trim().max(2000).optional(),
  businessPhone: z.string().regex(/^(\+254|07)\d{8,13}$/, "Enter a valid business phone"),
  businessAddress: z.string().optional(),
  estateId: z.string().optional(),
});

const VendorOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [locationInEstate, setLocationInEstate] = useState<string>("inside");
  const [estates, setEstates] = useState<Estate[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    const fetchEstates = async () => {
      const { data } = await supabase
        .from("estates")
        .select("id, name, location, county")
        .eq("is_approved", true)
        .eq("is_active", true)
        .order("name");
      setEstates(data || []);
    };
    fetchEstates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    const result = vendorFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const slug = formData.businessName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const { error: profileError } = await supabase.from("vendor_profiles").insert({
        user_id: authData.user.id,
        business_name: formData.businessName,
        business_type: formData.businessType,
        business_description: formData.businessDescription || null,
        business_phone: formData.businessPhone,
        business_address: formData.businessAddress || null,
        slug,
        estate_id: locationInEstate === "inside" && formData.estateId ? formData.estateId : null,
        is_approved: false,
      });

      if (profileError) throw profileError;

      setSubmitted(true);
    } catch (error: any) {
      toast.error(error?.message || "An error occurred during submission");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-2">
            <div className="mx-auto mb-4">
              <MtaaLoopLogo />
            </div>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Application Submitted!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your vendor application is now under review. Our team will get back to you shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your email to verify your account. Once approved by our admin team, you'll be able to log in and start accepting orders.
            </p>
            <Link to="/auth/login">
              <Button variant="outline" className="w-full mt-2">
                <ArrowLeft className="h-4 w-4 mr-2" /> Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <MtaaLoopLogo />
          <div>
            <h1 className="text-lg font-bold text-foreground">MtaaLoop Vendor Onboarding</h1>
            <p className="text-xs text-muted-foreground">Your neighbourhood, delivered.</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-12">
        {/* Hero */}
        <div className="mb-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Store className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Become a MtaaLoop Vendor</h2>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            Join hundreds of vendors reaching customers in their estates. Fill out the form below to get started.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Application</CardTitle>
            <CardDescription>All fields marked are required. We'll review your application within 24 hours.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground border-b pb-2">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" placeholder="+254 or 07..." required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" required placeholder="Min 8 chars, mixed case + number" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground border-b pb-2">Business Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input id="businessName" required value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
                    {errors.businessName && <p className="text-sm text-destructive mt-1">{errors.businessName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] bg-background border shadow-lg z-50">
                        <SelectItem value="food-drinks">Food & Drinks</SelectItem>
                        <SelectItem value="living-essentials">Living Essentials</SelectItem>
                        <SelectItem value="groceries-food">Groceries & Food</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="liquor-store">Liquor Store</SelectItem>
                        <SelectItem value="flowers-gifts">Flowers & Gifts</SelectItem>
                        <SelectItem value="utilities-services">Utilities & Services</SelectItem>
                        <SelectItem value="home-services">Home Services</SelectItem>
                        <SelectItem value="beauty-spa">Beauty & Spa</SelectItem>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.businessType && <p className="text-sm text-destructive mt-1">{errors.businessType}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="businessPhone">Business Phone *</Label>
                  <Input id="businessPhone" type="tel" placeholder="+254 or 07..." required value={formData.businessPhone} onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })} />
                  {errors.businessPhone && <p className="text-sm text-destructive mt-1">{errors.businessPhone}</p>}
                </div>

                <div className="space-y-3">
                  <Label>Business Location</Label>
                  <RadioGroup value={locationInEstate} onValueChange={setLocationInEstate}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="inside" id="loc-inside" />
                      <Label htmlFor="loc-inside" className="font-normal cursor-pointer">Inside an Estate/Apartment Complex</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="outside" id="loc-outside" />
                      <Label htmlFor="loc-outside" className="font-normal cursor-pointer">Outside (Street/Commercial Location)</Label>
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
                    <Label htmlFor="businessAddress">Business Address *</Label>
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
                    placeholder="Tell us about your business, what you sell, your specialties..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} className="mt-0.5" />
                <Label htmlFor="terms" className="text-sm cursor-pointer leading-snug">
                  I agree to MtaaLoop's terms and conditions and understand my application will be reviewed before activation.
                </Label>
              </div>
            </CardContent>

            <div className="px-6 pb-6 space-y-3">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Submitting Application..." : "Submit Vendor Application"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link to="/auth/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MtaaLoop. Your neighbourhood, delivered.</p>
          <p className="mt-1">Questions? Contact us at support@mtaaloop.com</p>
        </div>
      </div>
    </div>
  );
};

export default VendorOnboarding;
