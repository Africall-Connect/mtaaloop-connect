import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, UserPlus, Store, User, Bike } from 'lucide-react';
import { toast } from 'sonner';

// --- Zod Schemas ---
const phoneSchema = z.string().regex(/^(\+254|07)\d{8,13}$/, 'Enter a valid Kenyan phone number (+254… or 07…)');

const baseSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Enter a valid email address'),
  phone: phoneSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

const vendorSchema = baseSchema.extend({
  businessName: z.string().trim().min(2, 'Business name is required').max(100),
  businessType: z.string().min(1, 'Select a business type'),
  businessPhone: phoneSchema,
  businessDescription: z.string().optional(),
  businessAddress: z.string().optional(),
  estateId: z.string().optional(),
});

const customerSchema = baseSchema;

const riderSchema = baseSchema.extend({
  idNumber: z.string().trim().min(1, 'ID number is required'),
  vehicleType: z.string().min(1, 'Select a vehicle type'),
  vehicleRegistration: z.string().optional(),
  licenseNumber: z.string().optional(),
  estateId: z.string().optional(),
});

type FieldErrors = Record<string, string>;

interface Estate {
  id: string;
  name: string;
  location: string;
  county: string;
}

// --- Helper: render field error ---
function FieldError({ errors, field }: { errors: FieldErrors; field: string }) {
  if (!errors[field]) return null;
  return <p className="text-sm text-destructive mt-1">{errors[field]}</p>;
}

export default function AdminOnboarding() {
  const [activeTab, setActiveTab] = useState('vendor');
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Vendor form
  const [vendorForm, setVendorForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    businessName: '', businessType: '', businessDescription: '',
    businessPhone: '', businessAddress: '', estateId: '',
  });
  const [locationInEstate, setLocationInEstate] = useState('inside');

  // Customer form
  const [customerForm, setCustomerForm] = useState({
    fullName: '', email: '', phone: '', password: '',
  });

  // Rider form
  const [riderForm, setRiderForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    idNumber: '', vehicleType: '', vehicleRegistration: '', licenseNumber: '', estateId: '',
  });

  useEffect(() => { fetchEstates(); }, []);

  const fetchEstates = async () => {
    const { data } = await supabase
      .from('estates')
      .select('id, name, location, county')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('name');
    setEstates(data || []);
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const parseZod = <T,>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false } => {
    const result = schema.safeParse(data);
    if (result.success) {
      setErrors({});
      return { success: true, data: result.data };
    }
    const fieldErrors: FieldErrors = {};
    result.error.errors.forEach((e) => { if (e.path[0]) fieldErrors[String(e.path[0])] = e.message; });
    setErrors(fieldErrors);
    return { success: false };
  };

  // --- Vendor submit ---
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseZod(vendorSchema, vendorForm);
    if (!parsed.success) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: vendorForm.email,
        password: vendorForm.password,
        options: { data: { full_name: vendorForm.fullName, phone: vendorForm.phone } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;
      const slug = vendorForm.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const { error: profileError } = await supabase.from('vendor_profiles').insert({
        user_id: userId,
        business_name: vendorForm.businessName,
        business_type: vendorForm.businessType,
        business_description: vendorForm.businessDescription,
        business_phone: vendorForm.businessPhone,
        business_address: vendorForm.businessAddress,
        slug,
        estate_id: locationInEstate === 'inside' && vendorForm.estateId ? vendorForm.estateId : null,
        is_approved: true,
      });
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from('user_roles').insert({ user_id: userId, role: 'vendor' });
      if (roleError) throw roleError;

      toast.success(`Vendor "${vendorForm.businessName}" onboarded successfully!`);
      setVendorForm({ fullName: '', email: '', phone: '', password: '', businessName: '', businessType: '', businessDescription: '', businessPhone: '', businessAddress: '', estateId: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard vendor');
    } finally {
      setLoading(false);
    }
  };

  // --- Customer submit ---
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseZod(customerSchema, customerForm);
    if (!parsed.success) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: customerForm.email,
        password: customerForm.password,
        options: { data: { full_name: customerForm.fullName, phone: customerForm.phone } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;
      const nameParts = customerForm.fullName.trim().split(' ');
      await supabase.from('profiles').upsert({
        id: userId,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        phone: customerForm.phone,
        email: customerForm.email,
      });

      const { error: roleError } = await supabase.from('user_roles').insert({ user_id: userId, role: 'customer' });
      if (roleError) throw roleError;

      toast.success(`Customer "${customerForm.fullName}" onboarded successfully!`);
      setCustomerForm({ fullName: '', email: '', phone: '', password: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard customer');
    } finally {
      setLoading(false);
    }
  };

  // --- Rider submit ---
  const handleRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseZod(riderSchema, riderForm);
    if (!parsed.success) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: riderForm.email,
        password: riderForm.password,
        options: { data: { full_name: riderForm.fullName, phone: riderForm.phone } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;

      const { error: profileError } = await supabase.from('rider_profiles').insert({
        user_id: userId,
        full_name: riderForm.fullName,
        phone: riderForm.phone,
        email: riderForm.email,
        id_number: riderForm.idNumber,
        vehicle_type: riderForm.vehicleType,
        vehicle_registration: riderForm.vehicleRegistration || null,
        license_number: riderForm.licenseNumber || null,
        estate_id: riderForm.estateId || null,
        is_approved: true,
      });
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from('user_roles').insert({ user_id: userId, role: 'rider' });
      if (roleError) throw roleError;

      toast.success(`Delivery agent "${riderForm.fullName}" onboarded successfully!`);
      setRiderForm({ fullName: '', email: '', phone: '', password: '', idNumber: '', vehicleType: '', vehicleRegistration: '', licenseNumber: '', estateId: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard delivery agent');
    } finally {
      setLoading(false);
    }
  };

  // --- Helper to update form and clear error ---
  const updateVendor = (field: string, value: string) => { clearFieldError(field); setVendorForm((p) => ({ ...p, [field]: value })); };
  const updateCustomer = (field: string, value: string) => { clearFieldError(field); setCustomerForm((p) => ({ ...p, [field]: value })); };
  const updateRider = (field: string, value: string) => { clearFieldError(field); setRiderForm((p) => ({ ...p, [field]: value })); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-800 shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Link to="/admin/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Onboard Users
            </h1>
            <p className="text-sm text-blue-100">Create vendor, customer, or delivery agent accounts on their behalf</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setErrors({}); }}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Store className="h-4 w-4" /> Vendor
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Customer
            </TabsTrigger>
            <TabsTrigger value="rider" className="flex items-center gap-2">
              <Bike className="h-4 w-4" /> Delivery Agent
            </TabsTrigger>
          </TabsList>

          {/* ===== VENDOR TAB ===== */}
          <TabsContent value="vendor">
            <Card>
              <CardHeader>
                <CardTitle>New Vendor Registration</CardTitle>
                <CardDescription>Create a vendor account. The vendor will be auto-approved and receive a confirmation email.</CardDescription>
              </CardHeader>
              <form onSubmit={handleVendorSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="v-fullName">Full Name</Label>
                        <Input id="v-fullName" value={vendorForm.fullName} onChange={(e) => updateVendor('fullName', e.target.value)} />
                        <FieldError errors={errors} field="fullName" />
                      </div>
                      <div>
                        <Label htmlFor="v-phone">Phone Number</Label>
                        <Input id="v-phone" type="tel" placeholder="+254…" value={vendorForm.phone} onChange={(e) => updateVendor('phone', e.target.value)} />
                        <FieldError errors={errors} field="phone" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="v-email">Email</Label>
                        <Input id="v-email" type="email" value={vendorForm.email} onChange={(e) => updateVendor('email', e.target.value)} />
                        <FieldError errors={errors} field="email" />
                      </div>
                      <div>
                        <Label htmlFor="v-password">Temporary Password</Label>
                        <Input id="v-password" type="password" value={vendorForm.password} onChange={(e) => updateVendor('password', e.target.value)} />
                        <FieldError errors={errors} field="password" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Business Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="v-businessName">Business Name</Label>
                        <Input id="v-businessName" value={vendorForm.businessName} onChange={(e) => updateVendor('businessName', e.target.value)} />
                        <FieldError errors={errors} field="businessName" />
                      </div>
                      <div>
                        <Label htmlFor="v-businessType">Business Type</Label>
                        <Select value={vendorForm.businessType} onValueChange={(v) => updateVendor('businessType', v)}>
                          <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="food-drinks">Food & Drinks</SelectItem>
                            <SelectItem value="living-essentials">Living Essentials</SelectItem>
                            <SelectItem value="groceries-food">Groceries & Food</SelectItem>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                            <SelectItem value="liquor-store">Liquor Store</SelectItem>
                            <SelectItem value="utilities-services">Utilities & Services</SelectItem>
                            <SelectItem value="home-services">Home Services</SelectItem>
                            <SelectItem value="beauty-spa">Beauty & Spa</SelectItem>
                            <SelectItem value="accommodation">Accommodation</SelectItem>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError errors={errors} field="businessType" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="v-businessPhone">Business Phone</Label>
                      <Input id="v-businessPhone" type="tel" placeholder="+254…" value={vendorForm.businessPhone} onChange={(e) => updateVendor('businessPhone', e.target.value)} />
                      <FieldError errors={errors} field="businessPhone" />
                    </div>

                    <div className="space-y-3">
                      <Label>Business Location</Label>
                      <RadioGroup value={locationInEstate} onValueChange={setLocationInEstate}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inside" id="v-inside" />
                          <Label htmlFor="v-inside" className="font-normal cursor-pointer">Inside an Estate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outside" id="v-outside" />
                          <Label htmlFor="v-outside" className="font-normal cursor-pointer">Outside (Street/Commercial)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {locationInEstate === 'inside' ? (
                      <div>
                        <Label>Select Estate</Label>
                        <Select onValueChange={(v) => updateVendor('estateId', v)}>
                          <SelectTrigger><SelectValue placeholder="Choose estate" /></SelectTrigger>
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
                        <Label htmlFor="v-businessAddress">Business Address</Label>
                        <Input id="v-businessAddress" placeholder="Street address, building, area" value={vendorForm.businessAddress} onChange={(e) => updateVendor('businessAddress', e.target.value)} />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="v-businessDescription">Business Description</Label>
                      <Textarea id="v-businessDescription" placeholder="Describe the business..." value={vendorForm.businessDescription} onChange={(e) => updateVendor('businessDescription', e.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Vendor...' : 'Create Vendor Account'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>

          {/* ===== CUSTOMER TAB ===== */}
          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle>New Customer Registration</CardTitle>
                <CardDescription>Create a customer account. The user will receive a confirmation email.</CardDescription>
              </CardHeader>
              <form onSubmit={handleCustomerSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="c-fullName">Full Name</Label>
                      <Input id="c-fullName" placeholder="John Kamau" value={customerForm.fullName} onChange={(e) => updateCustomer('fullName', e.target.value)} />
                      <FieldError errors={errors} field="fullName" />
                    </div>
                    <div>
                      <Label htmlFor="c-phone">Phone Number</Label>
                      <Input id="c-phone" type="tel" placeholder="+254 712 345 678" value={customerForm.phone} onChange={(e) => updateCustomer('phone', e.target.value)} />
                      <FieldError errors={errors} field="phone" />
                    </div>
                    <div>
                      <Label htmlFor="c-email">Email</Label>
                      <Input id="c-email" type="email" placeholder="john@example.com" value={customerForm.email} onChange={(e) => updateCustomer('email', e.target.value)} />
                      <FieldError errors={errors} field="email" />
                    </div>
                    <div>
                      <Label htmlFor="c-password">Temporary Password</Label>
                      <Input id="c-password" type="password" placeholder="Min 8 chars, upper+lower+number" value={customerForm.password} onChange={(e) => updateCustomer('password', e.target.value)} />
                      <FieldError errors={errors} field="password" />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Customer...' : 'Create Customer Account'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>

          {/* ===== RIDER / DELIVERY AGENT TAB ===== */}
          <TabsContent value="rider">
            <Card>
              <CardHeader>
                <CardTitle>New Delivery Agent Registration</CardTitle>
                <CardDescription>Create a delivery agent account. The agent will be auto-approved and receive a confirmation email.</CardDescription>
              </CardHeader>
              <form onSubmit={handleRiderSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="r-fullName">Full Name</Label>
                        <Input id="r-fullName" value={riderForm.fullName} onChange={(e) => updateRider('fullName', e.target.value)} />
                        <FieldError errors={errors} field="fullName" />
                      </div>
                      <div>
                        <Label htmlFor="r-phone">Phone Number</Label>
                        <Input id="r-phone" type="tel" placeholder="+254…" value={riderForm.phone} onChange={(e) => updateRider('phone', e.target.value)} />
                        <FieldError errors={errors} field="phone" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="r-email">Email</Label>
                        <Input id="r-email" type="email" value={riderForm.email} onChange={(e) => updateRider('email', e.target.value)} />
                        <FieldError errors={errors} field="email" />
                      </div>
                      <div>
                        <Label htmlFor="r-password">Temporary Password</Label>
                        <Input id="r-password" type="password" value={riderForm.password} onChange={(e) => updateRider('password', e.target.value)} />
                        <FieldError errors={errors} field="password" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Agent Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="r-idNumber">National ID Number</Label>
                        <Input id="r-idNumber" value={riderForm.idNumber} onChange={(e) => updateRider('idNumber', e.target.value)} />
                        <FieldError errors={errors} field="idNumber" />
                      </div>
                      <div>
                        <Label htmlFor="r-vehicleType">Vehicle Type</Label>
                        <Select value={riderForm.vehicleType} onValueChange={(v) => updateRider('vehicleType', v)}>
                          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="bicycle">Bicycle</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="walking">Walking</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError errors={errors} field="vehicleType" />
                      </div>
                    </div>

                    {(riderForm.vehicleType === 'motorcycle' || riderForm.vehicleType === 'car' || riderForm.vehicleType === 'van') && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="r-vehicleReg">Vehicle Registration</Label>
                          <Input id="r-vehicleReg" placeholder="KAA 123A" value={riderForm.vehicleRegistration} onChange={(e) => updateRider('vehicleRegistration', e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="r-license">License Number</Label>
                          <Input id="r-license" value={riderForm.licenseNumber} onChange={(e) => updateRider('licenseNumber', e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Assign to Estate (Optional)</Label>
                      <Select onValueChange={(v) => updateRider('estateId', v)}>
                        <SelectTrigger><SelectValue placeholder="No estate (freelance)" /></SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {estates.map((estate) => (
                            <SelectItem key={estate.id} value={estate.id}>
                              {estate.name} - {estate.location}, {estate.county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Delivery Agent...' : 'Create Delivery Agent Account'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
