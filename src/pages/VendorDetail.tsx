import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Heart, Star, MapPin, Clock, DollarSign, CheckCircle, Phone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isVendorCurrentlyOpen } from "@/lib/vendorHours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { VendorProfile, Product } from "@/types/database";
import { MenuItem } from "@/data/vendors";
import { MenuItemCard } from "@/components/vendor/MenuItemCard";
import { CustomizationModal } from "@/components/vendor/CustomizationModal";
import { ReviewsSection } from "@/components/vendor/ReviewsSection";
import { VendorStory } from "@/components/vendor/VendorStory";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { useCart } from "@/contexts/CartContext";

// Helper function to convert Product to MenuItem
const productToMenuItem = (product: Product): MenuItem => ({
  id: product.id,
  name: product.name,
  description: product.description || "",
  price: product.price,
  image: product.image_url || undefined,
  category: product.category,
  rating: 4.5, // Default rating since Product doesn't have this
  ordersThisWeek: product.orders_this_week || 0,
  isNew: product.is_new,
  isPopular: product.is_popular,
  customizations: product.customizations as MenuItem['customizations'],
});

const VendorDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { getItemCount, getTotal } = useCart();

  useEffect(() => {
    const loadVendor = async () => {
      if (!vendorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch vendor from Supabase
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('slug', vendorId)
          .single();

        if (vendorError) {
          console.error('Error loading vendor:', vendorError);
          setVendor(null);
          return;
        }

        setVendor(vendorData);

        // Fetch products for this vendor
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .eq('is_available', true)
          .order('is_popular', { ascending: false })
          .order('orders_this_week', { ascending: false });

        if (productsError) {
          console.error('Error loading products:', productsError);
        } else {
          setProducts(productsData || []);
        }
      } catch (error) {
        console.error('Error loading vendor:', error);
        setVendor(null);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Skeleton */}
        <div className="relative h-64 md:h-96 overflow-hidden bg-muted">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="container px-4 py-6 max-w-6xl mx-auto">
          {/* Vendor Info Card Skeleton */}
          <Card className="p-6 mb-6 border-primary/20">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex gap-3 mb-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>

          {/* Menu Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vendor not found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const categories: string[] = products ? Array.from(new Set(products.map((item) => item.category))) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Carousel */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img
          src={vendor.cover_image_url || vendor.logo_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop"}
          alt={vendor.business_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" className="rounded-full">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 max-w-6xl mx-auto">
        {/* Vendor Info Card */}
        <Card className="p-6 mb-6 border-primary/20">
          <h1 className="text-3xl font-bold mb-2">{vendor.business_name}</h1>
          <p className="text-muted-foreground mb-4">{vendor.tagline}</p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-warning text-warning" />
              <span className="font-semibold">{vendor.rating}</span>
              <span className="text-sm text-muted-foreground">({vendor.review_count} reviews)</span>
            </div>
            {vendor.is_approved && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{vendor.business_address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>{vendor.delivery_time} delivery</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>KSh {vendor.delivery_fee} fee</span>
            </div>
            {vendor.estate_id && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="border-success text-success">
                  Inside Your Estate
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm">
              <div className="font-medium">⏰ {vendor.open_hours || 'Hours not set'}</div>
              {isVendorCurrentlyOpen(vendor.open_hours, vendor.is_open) ? (
                <div className="flex items-center gap-2 text-emerald-600 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Open — Taking orders now
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive mt-1">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  Closed
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button variant="outline" size="sm">
                <Info className="w-4 h-4 mr-2" />
                More Info
              </Button>
            </div>
          </div>
        </Card>

        {/* Menu */}
        <Tabs defaultValue={categories.length > 0 ? categories[0] : "popular"} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
            <TabsTrigger value="popular">⭐ Popular</TabsTrigger>
            <TabsTrigger value="new">🆕 New</TabsTrigger>
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <h2 className="text-2xl font-bold mt-6 mb-4">{category}</h2>
              {products
                .filter((item) => item.category === category)
                .map((item) => {
                  const menuItem = productToMenuItem(item);
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={menuItem}
                      vendorId={vendor.id}
                      vendorName={vendor.business_name}
                      onCustomize={() => setSelectedItem(menuItem)}
                    />
                  );
                })}
            </TabsContent>
          ))}

          <TabsContent value="popular" className="space-y-4">
            <h2 className="text-2xl font-bold mt-6 mb-4">⭐ Popular Items</h2>
            {products
              .filter((item) => item.is_popular)
              .map((item) => {
                const menuItem = productToMenuItem(item);
                return (
                  <MenuItemCard
                    key={item.id}
                    item={menuItem}
                    vendorId={vendor.id}
                    vendorName={vendor.business_name}
                    onCustomize={() => setSelectedItem(menuItem)}
                  />
                );
              })}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <h2 className="text-2xl font-bold mt-6 mb-4">🆕 New Items</h2>
            {products
              .filter((item) => item.is_new)
              .map((item) => {
                const menuItem = productToMenuItem(item);
                return (
                  <MenuItemCard
                    key={item.id}
                    item={menuItem}
                    vendorId={vendor.id}
                    vendorName={vendor.business_name}
                    onCustomize={() => setSelectedItem(menuItem)}
                  />
                );
              })}
          </TabsContent>
        </Tabs>

        {/* Reviews */}
        <ReviewsSection rating={vendor.rating} reviewCount={vendor.review_count} />

        {/* Vendor Story */}
        <VendorStory
          description={vendor.business_description}
          categories={[]}
          yearsInBusiness={vendor.years_in_business}
          certifications={Array.isArray(vendor.certifications) ? vendor.certifications : []}
        />
      </div>

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationModal
          item={selectedItem}
          vendorId={vendor.id}
          vendorName={vendor.business_name}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Floating Cart */}
      {getItemCount() > 0 && (
        <FloatingCartButton />
      )}
    </div>
  );
};

export default VendorDetail;
