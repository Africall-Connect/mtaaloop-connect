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
    ownerIdNumber: "",
    email: "",
    phone: "",
    alternatePhone: "",
    password: "",
    businessName: "",
    businessType: "",
    otherCategory: "",
    businessDescription: "",
    businessPhone: "",
    businessAddress: "",
    nearestLandmark: "",
    estateOrBuildingName: "",
    mpesaNumber: "",
    paybillNumber: "",
    accountName: "",
    estateId: "",
    deliveryPreferences: [] as string[],
    hasFixedMenu: false,
    minOrderAmount: "",
    averagePreparationTime: "",
    maxDeliveryDistance: "",
    hasPackaging: false,
    canHandleBulk: false,
    documentSupport: [] as string[],
    additionalDocuments: "",
    whatsappBusiness: "",
    facebookPage: "",
    instagramHandle: "",
    website: "",
    bankName: "",
    bankBranch: "",
    bankAccountName: "",
    bankAccountNumber: "",
    additionalInformation: "",
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
          business_email: formData.email,
          business_address: formData.businessAddress,
          owner_id_number: formData.ownerIdNumber || null,
          alternate_phone: formData.alternatePhone || null,
          nearest_landmark: formData.nearestLandmark || null,
          estate_or_building_name: formData.estateOrBuildingName || null,
          mpesa_number: formData.mpesaNumber || null,
          paybill_number: formData.paybillNumber || null,
          account_name: formData.accountName || null,
          products_and_services: formData.businessDescription || null,
          has_fixed_menu: formData.hasFixedMenu,
          min_order_amount: formData.minOrderAmount ? parseInt(formData.minOrderAmount, 10) : null,
          average_preparation_time: formData.averagePreparationTime || null,
          max_delivery_distance: formData.maxDeliveryDistance || null,
          delivery_preferences: formData.deliveryPreferences.length > 0 ? formData.deliveryPreferences : null,
          has_packaging: formData.hasPackaging,
          can_handle_bulk: formData.canHandleBulk,
          document_support: formData.documentSupport.length > 0 ? formData.documentSupport : null,
          additional_documents: formData.additionalDocuments || null,
          whatsapp_business: formData.whatsappBusiness || null,
          facebook_page: formData.facebookPage || null,
          instagram_handle: formData.instagramHandle || null,
          website: formData.website || null,
          bank_name: formData.bankName || null,
          bank_branch: formData.bankBranch || null,
          bank_account_name: formData.bankAccountName || null,
          bank_account_number: formData.bankAccountNumber || null,
          additional_information: formData.additionalInformation || null,
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
              <h3 className="font-semibold">Section 1 — Business Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business / Store Name</Label>
                  <Input
                    id="businessName"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Business Owner Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerIdNumber">ID Number</Label>
                  <Input
                    id="ownerIdNumber"
                    value={formData.ownerIdNumber}
                    onChange={(e) => setFormData({ ...formData, ownerIdNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="alternatePhone">Alternate Phone Number</Label>
                  <Input
                    id="alternatePhone"
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Primary Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
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
              <h3 className="font-semibold">Section 2 — Business Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessType">Business Category</Label>
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
                </div>
                <div>
                  <Label htmlFor="otherCategory">Other Category</Label>
                  <Input
                    id="otherCategory"
                    value={formData.otherCategory}
                    onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                    placeholder="If not listed"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="businessAddress">Physical Location / Address</Label>
                  <Input
                    id="businessAddress"
                    required
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nearestLandmark">Nearest Landmark</Label>
                  <Input
                    id="nearestLandmark"
                    value={formData.nearestLandmark}
                    onChange={(e) => setFormData({ ...formData, nearestLandmark: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="estateOrBuildingName">Estate or Building Name</Label>
                  <Input
                    id="estateOrBuildingName"
                    value={formData.estateOrBuildingName}
                    onChange={(e) => setFormData({ ...formData, estateOrBuildingName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mpesaNumber">M-Pesa Number for Payments</Label>
                  <Input
                    id="mpesaNumber"
                    value={formData.mpesaNumber}
                    onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="paybillNumber">Paybill / Till Number</Label>
                  <Input
                    id="paybillNumber"
                    value={formData.paybillNumber}
                    onChange={(e) => setFormData({ ...formData, paybillNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessDescription">Product/Service Description</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    placeholder="Main products or services offered"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrderAmount">Minimum Order Amount (KES)</Label>
                  <Input
                    id="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="averagePreparationTime">Average Delivery Preparation Time</Label>
                  <Input
                    id="averagePreparationTime"
                    value={formData.averagePreparationTime}
                    onChange={(e) => setFormData({ ...formData, averagePreparationTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDeliveryDistance">Maximum Delivery Distance</Label>
                  <Input
                    id="maxDeliveryDistance"
                    value={formData.maxDeliveryDistance}
                    onChange={(e) => setFormData({ ...formData, maxDeliveryDistance: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="additionalInformation">Additional Information</Label>
                  <Textarea
                    id="additionalInformation"
                    value={formData.additionalInformation}
                    onChange={(e) => setFormData({ ...formData, additionalInformation: e.target.value })}
                    placeholder="Special instructions, promotions, unique offerings"
                  />
                </div>
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
