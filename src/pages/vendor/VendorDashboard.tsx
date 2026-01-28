import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Store, Package, ShoppingBag, Star, LogOut, Sparkles } from 'lucide-react';
import ProductManagement from './ProductManagement';
import OrdersManagement from './OrdersManagement';
import CommunicationsHub from './CommunicationsHub';
import CategoryManagement from './CategoryManagement';

interface VendorProfile {
  business_name: string;
  business_type: string;
  is_approved: boolean;
  rating: number;
  total_orders: number;
}

export default function VendorDashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [realVendorId, setRealVendorId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, business_type, is_approved, rating, total_orders')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setRealVendorId(data?.id || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="h-6 w-6" />
              {profile?.business_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={profile?.is_approved ? 'default' : 'secondary'}>
                {profile?.is_approved ? 'Approved' : 'Pending Approval'}
              </Badge>
              <Badge variant="outline">{profile?.business_type}</Badge>
            </div>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">
            🎉 New Enhanced Vendor Portal Available!
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            <p className="mb-3">
              We've built a completely redesigned vendor dashboard with advanced features including:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>Real-time order management with live tracking</li>
              <li>Advanced analytics and performance insights</li>
              <li>Customer relationship management</li>
              <li>Marketing campaigns and promotions</li>
              <li>Bulk messaging (SMS & Email)</li>
            </ul>
            <Button 
              onClick={() => navigate('/vendor/portal')} 
              className="mt-2"
              size="sm"
            >
              Switch to New Dashboard →
            </Button>
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.total_orders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.rating ? `${profile.rating}/5.0` : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {!profile?.is_approved && (
          <Card className="border-amber-500">
            <CardHeader>
              <CardTitle className="text-amber-500">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your vendor application is currently under review. You'll be notified once approved
                and can start adding products and receiving orders.
              </p>
            </CardContent>
          </Card>
        )}

        {profile?.is_approved && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant="outline" className="justify-start">
                      <Package className="mr-2 h-4 w-4" />
                      Manage Products
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      View Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManagement vendorId={realVendorId || ''} />
            </TabsContent>

            <TabsContent value="products">
              <ProductManagement 
                vendorId={realVendorId || ''} 
                onSwitchToCategories={() => setActiveTab('categories')}
              />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersManagement vendorId={realVendorId || ''} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
