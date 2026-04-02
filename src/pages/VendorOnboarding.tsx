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
import { MtaaLoopOrbit } from "@/components/MtaaLoopLogo";
import { CheckCircle, Store, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";

const vendorFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  ownerIdNumber: z.string().trim().optional(),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().regex(/^(\+254|07)\d{8,13}$/, "Enter a valid Kenyan phone number"),
  alternatePhone: z.string().regex(/^(\+254|07)\d{8,13}$/, "Enter a valid Kenyan phone number").optional(),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  businessName: z.string().trim().min(2, "Business name is required"),
  businessType: z.array(z.string()).optional(),
  otherCategory: z.string().trim().optional(),
  businessDescription: z.string().trim().max(2000).optional(),
  businessPhone: z.string().regex(/^(\+254|07)\d{8,13}$/, "Enter a valid business phone"),
  businessAddress: z.string().optional(),
  estateId: z.string().optional(),
  nearestLandmark: z.string().optional(),
  estateOrBuildingName: z.string().optional(),
  mpesaNumber: z.string().optional(),
  paybillNumber: z.string().optional(),
  accountName: z.string().optional(),
  productsAndServices: z.string().optional(),
  hasFixedMenu: z.boolean().optional(),
  minOrderAmount: z.string().optional(),
  averagePreparationTime: z.string().optional(),
  maxDeliveryDistance: z.string().optional(),
  deliveryPreferences: z.array(z.string()).optional(),
  hasPackaging: z.boolean().optional(),
  canHandleBulk: z.boolean().optional(),
  documentSupport: z.array(z.string()).optional(),
  additionalDocuments: z.string().optional(),
  whatsappBusiness: z.string().optional(),
  facebookPage: z.string().optional(),
  instagramHandle: z.string().optional(),
  website: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  additionalInformation: z.string().optional(),
  vendorSignature: z.string().optional(),
  applicationDate: z.string().optional(),
});

const VendorOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [locationInEstate, setLocationInEstate] = useState<string>("inside");
  const [estates, setEstates] = useState<Estate[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasError = (field: string) => Boolean(errors[field]);
  const errorClass = (field: string) =>
    hasError(field)
      ? "border-destructive text-destructive focus-visible:ring-destructive focus-visible:ring-2"
      : "";

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    fullName: "",
    ownerIdNumber: "",
    email: "",
    phone: "",
    alternatePhone: "",
    password: "",
    businessName: "",
    businessType: [] as string[],
    otherCategory: "",
    businessDescription: "",
    businessPhone: "",
    businessAddress: "",
    estateId: "",
    nearestLandmark: "",
    estateOrBuildingName: "",
    mpesaNumber: "",
    paybillNumber: "",
    accountName: "",
    productsAndServices: "",
    hasFixedMenu: false,
    minOrderAmount: "",
    averagePreparationTime: "",
    maxDeliveryDistance: "",
    deliveryPreferences: [] as string[],
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
    vendorSignature: "",
    applicationDate: new Date().toISOString().slice(0, 10),
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

  const STORAGE_BUCKET = process.env.VITE_SUPABASE_DOC_BUCKET || "vendor-documents";

  const uploadDocumentToStorage = async (file: File, vendorId: string) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${vendorId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message?.toLowerCase().includes("bucket not found")) {
        throw new Error(`Bucket "${STORAGE_BUCKET}" not found. Create it in Supabase Storage before retrying.`);
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data?.publicUrl ?? "";
  };

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

      const flowSlug = formData.businessName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || `vendor-${Date.now()}`;

      const businessTypeValue =
        Array.isArray(formData.businessType) && formData.businessType.length > 0
          ? formData.businessType.join(", ")
          : "general";

      const businessAddressValue = formData.businessAddress?.trim() || "Not provided";

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const documentUrls = [] as string[];
      if (documentFiles.length > 0) {
        for (const file of documentFiles) {
          try {
            const publicUrl = await uploadDocumentToStorage(file, authData.user.id);
            if (publicUrl) documentUrls.push(publicUrl);
          } catch (err: any) {
            console.error("Document upload failed", err);
            toast.error(err?.message || "Failed to upload business document. Please try again.");
            setLoading(false);
            return;
          }
        }
      }

      const { error: profileError } = await supabase.from("vendor_profiles").insert({
        user_id: authData.user.id,
        business_name: formData.businessName,
        business_type: businessTypeValue,
        business_description: formData.businessDescription || null,
        business_phone: formData.businessPhone,
        business_email: formData.email || null,
        business_address: businessAddressValue,
        owner_id_number: formData.ownerIdNumber || null,
        slug: flowSlug,
        alternate_phone: formData.alternatePhone || null,
        nearest_landmark: formData.nearestLandmark || null,
        estate_or_building_name: formData.estateOrBuildingName || null,
        mpesa_number: formData.mpesaNumber || null,
        paybill_number: formData.paybillNumber || null,
        account_name: formData.accountName || null,
        products_and_services: formData.productsAndServices || null,
        document_support: documentUrls.length > 0 ? documentUrls : formData.documentSupport.length > 0 ? formData.documentSupport : null,
        has_fixed_menu: formData.hasFixedMenu,
        min_order_amount: formData.minOrderAmount ? parseInt(formData.minOrderAmount, 10) : null,
        average_preparation_time: formData.averagePreparationTime || null,
        max_delivery_distance: formData.maxDeliveryDistance || null,
        delivery_preferences: formData.deliveryPreferences.length > 0 ? formData.deliveryPreferences : null,
        has_packaging: formData.hasPackaging,
        can_handle_bulk: formData.canHandleBulk,
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
        vendor_signature: formData.vendorSignature || null,
        application_date: formData.applicationDate || null,
      } as any);

      if (profileError) throw profileError;

      setSubmitted(true);
    } catch (error: any) {
      const msg = error?.message || error?.details || "Unknown error";
      toast.error(`Failed to create profile: ${msg}`);
      return;
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
              <MtaaLoopOrbit size={60} />
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
              Your vendor application is submitted. Our team reviews it quickly, and you will be updated when it's approved.
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
          <MtaaLoopOrbit size={40} />
          <div>
            <h1 className="text-lg font-bold text-foreground">MtaaLoop Vendor Onboarding</h1>
            <p className="text-xs text-muted-foreground">Your neighbourhood, delivered.</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-12">
        {/* Hero */}
        <div className="mb-6 text-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-lg">
          <img src="/logo.png" alt="MtaaLoop Vendor Onboarding Logo" className="mx-auto mb-4 h-24 w-auto object-contain" />
          <h2 className="text-3xl font-bold text-foreground">Become a MtaaLoop Vendor</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Join hundreds of vendors reaching customers in their estates. Fill out the form below to get started.
          </p>
          <p className="mt-4 text-sm text-primary font-semibold">
            Already have an account? <Link to="/auth/login" className="text-blue-700 hover:text-blue-800 underline">Sign in here</Link>
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
                <h3 className="font-semibold text-foreground border-b pb-2">Section 1 — Business Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName" className={hasError("businessName") ? "text-destructive" : ""}>Business / Store Name *</Label>
                    <Input
                      id="businessName"
                      required
                      className={errorClass("businessName")}
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                    {errors.businessName && <p className="text-sm text-destructive mt-1">{errors.businessName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="fullName" className={hasError("fullName") ? "text-destructive" : ""}>Business Owner Full Name *</Label>
                    <Input
                      id="fullName"
                      required
                      className={errorClass("fullName")}
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerIdNumber">ID Number</Label>
                    <Input id="ownerIdNumber" className={errorClass("ownerIdNumber")} value={formData.ownerIdNumber} onChange={(e) => setFormData({ ...formData, ownerIdNumber: e.target.value })} />
                    {errors.ownerIdNumber && <p className="text-sm text-destructive mt-1">{errors.ownerIdNumber}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone" className={hasError("phone") ? "text-destructive" : ""}>Phone Number (Primary) *</Label>
                    <Input id="phone" type="tel" placeholder="+254 or 07..." required className={errorClass("phone")} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alternatePhone" className={hasError("alternatePhone") ? "text-destructive" : ""}>Alternate Phone Number</Label>
                    <Input id="alternatePhone" type="tel" placeholder="Optional" className={errorClass("alternatePhone")} value={formData.alternatePhone} onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })} />
                    {errors.alternatePhone && <p className="text-sm text-destructive mt-1">{errors.alternatePhone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className={hasError("email") ? "text-destructive" : ""}>Email *</Label>
                    <Input id="email" type="email" required className={errorClass("email")} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessAddress">Physical Location / Address of Business</Label>
                    <Input id="businessAddress" placeholder="Address" className={errorClass("businessAddress")} value={formData.businessAddress} onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })} />
                    {errors.businessAddress && <p className="text-sm text-destructive mt-1">{errors.businessAddress}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nearestLandmark">Nearest Landmark</Label>
                    <Input id="nearestLandmark" className={errorClass("nearestLandmark")} value={formData.nearestLandmark} onChange={(e) => setFormData({ ...formData, nearestLandmark: e.target.value })} />
                    {errors.nearestLandmark && <p className="text-sm text-destructive mt-1">{errors.nearestLandmark}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estateOrBuildingName">Estate or Building Name</Label>
                    <Input id="estateOrBuildingName" value={formData.estateOrBuildingName} onChange={(e) => setFormData({ ...formData, estateOrBuildingName: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="mpesaNumber">M-Pesa Number for Payments</Label>
                    <Input id="mpesaNumber" value={formData.mpesaNumber} onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paybillNumber">Paybill / Till Number (if applicable)</Label>
                    <Input id="paybillNumber" value={formData.paybillNumber} onChange={(e) => setFormData({ ...formData, paybillNumber: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input id="accountName" value={formData.accountName} onChange={(e) => setFormData({ ...formData, accountName: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password" className={hasError("password") ? "text-destructive" : ""}>Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="Min 8 chars, mixed case + number"
                      className={errorClass("password")}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground border-b pb-2">Business Information (Continued)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType" className={hasError("businessType") ? "text-destructive" : ""}>Business Type *</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, businessType: [value] })}>
                      <SelectTrigger className={errorClass("businessType")}>
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
                  <Label htmlFor="businessPhone" className={hasError("businessPhone") ? "text-destructive" : ""}>Business Phone *</Label>
                  <Input id="businessPhone" type="tel" placeholder="+254 or 07..." required className={errorClass("businessPhone")} value={formData.businessPhone} onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })} />
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

                {/* SECTION 2 — BUSINESS CATEGORY */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Business Category</h4>
                  <p className="text-xs text-muted-foreground">Select one or more categories that describe your business.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-sm">
                    {[
                      "Gas and Cooking Fuel",
                      "Groceries and Fresh Produce",
                      "Pharmacy and Medicine",
                      "Water and Beverages",
                      "Fast Food and Cooked Meals",
                      "Bakery and Confectionery",
                      "Electronics and Accessories",
                      "Clothing and Fashion",
                      "Hardware and Home Supplies",
                      "Laundry and Cleaning Services",
                      "Beauty and Personal Care",
                      "Stationery and Office Supplies",
                      "Wines, Spirits and Beverages",
                      "Pet Supplies",
                    ].map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 border-primary text-primary focus:ring-primary"
                          checked={formData.businessType.includes(category)}
                          onChange={(e) => {
                            const selected = formData.businessType.includes(category)
                              ? formData.businessType.filter((item) => item !== category)
                              : [...formData.businessType, category];
                            setFormData({ ...formData, businessType: selected });
                          }}
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Label htmlFor="otherCategory">Other (specify)</Label>
                    <Input
                      id="otherCategory"
                      value={formData.otherCategory}
                      onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                      placeholder="If not listed"
                    />
                  </div>
                </div>

                {/* SECTION 3 — PRODUCTS AND SERVICES */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Products and Services</h4>
                  <Label htmlFor="productsAndServices">Main products or services offered</Label>
                  <Textarea
                    id="productsAndServices"
                    value={formData.productsAndServices}
                    onChange={(e) => setFormData({ ...formData, productsAndServices: e.target.value })}
                    placeholder="e.g. 6kg gas refill, 13kg gas refill, gas stove installation..."
                    rows={3}
                  />

                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Do you have a fixed menu or price list available?</Label>
                      <div className="flex items-center gap-4 mt-1">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="fixedMenu"
                            checked={formData.hasFixedMenu === true}
                            onChange={() => setFormData({ ...formData, hasFixedMenu: true })}
                          />
                          Yes
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="fixedMenu"
                            checked={formData.hasFixedMenu === false}
                            onChange={() => setFormData({ ...formData, hasFixedMenu: false })}
                          />
                          No
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="minOrderAmount">Minimum Order Amount (KES)</Label>
                      <Input
                        id="minOrderAmount"
                        value={formData.minOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                        placeholder="e.g. 250"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="averagePreparationTime">Average Delivery Preparation Time</Label>
                      <Input
                        id="averagePreparationTime"
                        value={formData.averagePreparationTime}
                        onChange={(e) => setFormData({ ...formData, averagePreparationTime: e.target.value })}
                        placeholder="e.g. 20-30 mins"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxDeliveryDistance">Maximum Delivery Distance</Label>
                      <Input
                        id="maxDeliveryDistance"
                        value={formData.maxDeliveryDistance}
                        onChange={(e) => setFormData({ ...formData, maxDeliveryDistance: e.target.value })}
                        placeholder="e.g. up to 5km"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4 — OPERATING HOURS */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Operating Hours</h4>
                  <p className="text-xs text-muted-foreground">Select availability for each day.</p>
                  <div className="grid gap-3 mt-3">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <div key={day} className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                        <span className="font-medium">{day}</span>
                        <Input type="text" placeholder="Opening time" className="w-full" />
                        <Input type="text" placeholder="Closing time" className="w-full" />
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" /> Yes
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 5 — DELIVERY PREFERENCES */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Delivery Preferences</h4>
                  <div className="grid gap-2 mt-2">
                    {[
                      { value: "mtaaloop_rider", label: "I will prepare order and hand it to a Mtaaloop rider" },
                      { value: "own_riders", label: "I have my own riders and can deliver independently" },
                      { value: "both", label: "Both options depending on the order" },
                      { value: "need_support", label: "I need Mtaaloop to provide full delivery support" },
                    ].map((pref) => (
                      <label key={pref.value} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.deliveryPreferences.includes(pref.value)}
                          onChange={(e) => {
                            const prefs = e.target.checked
                              ? [...formData.deliveryPreferences, pref.value]
                              : formData.deliveryPreferences.filter((item) => item !== pref.value);
                            setFormData({ ...formData, deliveryPreferences: prefs });
                          }}
                        />
                        {pref.label}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 grid md:grid-cols-2 gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.hasPackaging}
                        onChange={(e) => setFormData({ ...formData, hasPackaging: e.target.checked })}
                      />
                      I have packaging available
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.canHandleBulk}
                        onChange={(e) => setFormData({ ...formData, canHandleBulk: e.target.checked })}
                      />
                      I can handle bulk orders
                    </label>
                  </div>
                </div>

                {/* SECTION 6 — DOCUMENTS AND VERIFICATION */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Documents and Verification</h4>
                  <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm">
                    {[
                      "National ID or Passport (Owner)",
                      "Business Permit or Trading Licence",
                      "KRA PIN Certificate",
                      "M-Pesa or Bank Statement (last 3 months)",
                      "Certificate of Incorporation (if registered)",
                      "Health Certificate (for food vendors)",
                      "Product Photos or Store Photos",
                      "Any other relevant certification",
                    ].map((doc) => (
                      <label key={doc} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.documentSupport.includes(doc)}
                          onChange={(e) => {
                            const docs = e.target.checked
                              ? [...formData.documentSupport, doc]
                              : formData.documentSupport.filter((item) => item !== doc);
                            setFormData({ ...formData, documentSupport: docs });
                          }}
                        />
                        {doc}
                      </label>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="businessDocumentFiles">Upload Business Documents (PDF/JPG/PNG)</Label>
                    <input
                      id="businessDocumentFiles"
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      onChange={(e) => {
                        if (!e.target.files) return;
                        setDocumentFiles(Array.from(e.target.files));
                      }}
                      className="mt-1 block w-full text-sm text-gray-700"
                    />
                    {documentFiles.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        {documentFiles.map((file) => (
                          <p key={file.name} className="truncate">{file.name}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <Label htmlFor="additionalDocuments" className="mt-2">Additional documents</Label>
                  <Textarea
                    id="additionalDocuments"
                    value={formData.additionalDocuments}
                    onChange={(e) => setFormData({ ...formData, additionalDocuments: e.target.value })}
                    rows={2}
                    placeholder="Any other documents or certifications you would like to highlight"
                  />
                </div>

                {/* SECTION 7 — ONLINE PRESENCE */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Online Presence (Optional)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="whatsappBusiness">WhatsApp Business Number</Label>
                      <Input
                        id="whatsappBusiness"
                        value={formData.whatsappBusiness}
                        onChange={(e) => setFormData({ ...formData, whatsappBusiness: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebookPage">Facebook Page</Label>
                      <Input
                        id="facebookPage"
                        value={formData.facebookPage}
                        onChange={(e) => setFormData({ ...formData, facebookPage: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagramHandle">Instagram Handle</Label>
                      <Input
                        id="instagramHandle"
                        value={formData.instagramHandle}
                        onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 8 — BANK DETAILS */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Bank Details (Optional)</h4>
                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankBranch">Branch</Label>
                      <Input
                        id="bankBranch"
                        value={formData.bankBranch}
                        onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="bankAccountName">Account Name</Label>
                      <Input
                        id="bankAccountName"
                        value={formData.bankAccountName}
                        onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankAccountNumber">Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 9 — ADDITIONAL INFORMATION */}
                <div className="pt-4">
                  <h4 className="font-semibold text-foreground">Additional Information</h4>
                  <Textarea
                    id="additionalInformation"
                    value={formData.additionalInformation}
                    onChange={(e) => setFormData({ ...formData, additionalInformation: e.target.value })}
                    rows={3}
                    placeholder="Special instructions, seasonal availability, promotions, unique offerings..."
                  />
                </div>

                {/* SECTION 10 — DECLARATION */}
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-sm">
                    I confirm that all information provided in this form is accurate and complete to the best of my knowledge. I understand that providing false information may result in rejection or removal from the MtaaLoop platform.
                    I agree to comply with MtaaLoop's vendor terms, delivery standards and customer service expectations as communicated during onboarding and thereafter.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label htmlFor="vendorSignature" className={hasError("vendorSignature") ? "text-destructive" : ""}>Vendor Signature</Label>
                      <Input
                        id="vendorSignature"
                        placeholder="Vendor Signature"
                        className={errorClass("vendorSignature")}
                        value={formData.vendorSignature}
                        onChange={(e) => setFormData({ ...formData, vendorSignature: e.target.value })}
                      />
                      {errors.vendorSignature && <p className="text-sm text-destructive mt-1">{errors.vendorSignature}</p>}
                    </div>
                    <div>
                      <Label htmlFor="applicationDate" className={hasError("applicationDate") ? "text-destructive" : ""}>Application Date</Label>
                      <Input
                        id="applicationDate"
                        type="date"
                        className={errorClass("applicationDate")}
                        value={formData.applicationDate}
                        onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                      />
                      {errors.applicationDate && <p className="text-sm text-destructive mt-1">{errors.applicationDate}</p>}
                    </div>
                  </div>
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
