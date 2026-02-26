import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, UserPlus, Store, User } from 'lucide-react';
import { toast } from 'sonner';

interface Estate {
  id: string;
  name: string;
  location: string;
  county: string;
}

export default function AdminOnboarding() {
  const [activeTab, setActiveTab] = useState('vendor');
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);

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

  useEffect(() => {
    fetchEstates();
  }, []);

  const fetchEstates = async () => {
    const { data } = await supabase
      .from('estates')
      .select('id, name, location, county')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('name');
    setEstates(data || []);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: vendorForm.email,
        password: vendorForm.password,
        options: {
          data: {
            full_name: vendorForm.fullName,
            phone: vendorForm.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;

      // 2. Insert vendor profile (auto-approved)
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

      // 3. Assign vendor role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'vendor',
      });

      if (roleError) throw roleError;

      toast.success(`Vendor "${vendorForm.businessName}" onboarded successfully! They will receive a confirmation email.`);
      setVendorForm({
        fullName: '', email: '', phone: '', password: '',
        businessName: '', businessType: '', businessDescription: '',
        businessPhone: '', businessAddress: '', estateId: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: customerForm.email,
        password: customerForm.password,
        options: {
          data: {
            full_name: customerForm.fullName,
            phone: customerForm.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;

      // 2. Upsert profile
      const nameParts = customerForm.fullName.trim().split(' ');
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        phone: customerForm.phone,
        email: customerForm.email,
      });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
      }

      // 3. Assign customer role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'customer',
      });

      if (roleError) throw roleError;

      toast.success(`Customer "${customerForm.fullName}" onboarded successfully! They will receive a confirmation email.`);
      setCustomerForm({ fullName: '', email: '', phone: '', password: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard customer');
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-sm text-blue-100">Create vendor or customer accounts on their behalf</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Onboard Vendor
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Onboard Customer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor">
            <Card>
              <CardHeader>
                <CardTitle>New Vendor Registration</CardTitle>
                <CardDescription>
                  Create a vendor account. The vendor will be auto-approved and receive a confirmation email.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleVendorSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="v-fullName">Full Name</Label>
                        <Input id="v-fullName" required value={vendorForm.fullName}
                          onChange={(e) => setVendorForm({ ...vendorForm, fullName: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="v-phone">Phone Number</Label>
                        <Input id="v-phone" type="tel" required value={vendorForm.phone}
                          onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="v-email">Email</Label>
                        <Input id="v-email" type="email" required value={vendorForm.email}
                          onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="v-password">Temporary Password</Label>
                        <Input id="v-password" type="password" required minLength={6} value={vendorForm.password}
                          onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Business Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="v-businessName">Business Name</Label>
                        <Input id="v-businessName" required value={vendorForm.businessName}
                          onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="v-businessType">Business Type</Label>
                        <Select onValueChange={(value) => setVendorForm({ ...vendorForm, businessType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
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
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="v-businessPhone">Business Phone</Label>
                      <Input id="v-businessPhone" type="tel" required value={vendorForm.businessPhone}
                        onChange={(e) => setVendorForm({ ...vendorForm, businessPhone: e.target.value })} />
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
                        <Select onValueChange={(value) => setVendorForm({ ...vendorForm, estateId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose estate" />
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
                        <Label htmlFor="v-businessAddress">Business Address</Label>
                        <Input id="v-businessAddress" required placeholder="Street address, building, area"
                          value={vendorForm.businessAddress}
                          onChange={(e) => setVendorForm({ ...vendorForm, businessAddress: e.target.value })} />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="v-businessDescription">Business Description</Label>
                      <Textarea id="v-businessDescription" placeholder="Describe the business..."
                        value={vendorForm.businessDescription}
                        onChange={(e) => setVendorForm({ ...vendorForm, businessDescription: e.target.value })} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Vendor...' : 'Create Vendor Account'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle>New Customer Registration</CardTitle>
                <CardDescription>
                  Create a customer account. The user will receive a confirmation email.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCustomerSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="c-fullName">Full Name</Label>
                      <Input id="c-fullName" required placeholder="John Kamau" value={customerForm.fullName}
                        onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="c-phone">Phone Number</Label>
                      <Input id="c-phone" type="tel" required placeholder="+254 712 345 678" value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="c-email">Email</Label>
                      <Input id="c-email" type="email" required placeholder="john@example.com" value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="c-password">Temporary Password</Label>
                      <Input id="c-password" type="password" required minLength={6} placeholder="Min 6 characters"
                        value={customerForm.password}
                        onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Customer...' : 'Create Customer Account'}
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
