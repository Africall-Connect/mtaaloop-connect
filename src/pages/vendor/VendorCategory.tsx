import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { VendorNavbar } from "@/components/vendor/VendorNavbar";
import { VendorProductCard } from "@/components/vendor/VendorProductCard";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Package, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { VendorWithProducts, Product } from "@/types/database";

export default function VendorCategory() {
  const { vendorSlug, categorySlug } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorWithProducts | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("All Products");
  
  const { addItem, getItemCount, getTotal } = useCart();
  const { toast } = useToast();

  const fetchVendorAndProducts = useCallback(async () => {
    if (!vendorSlug) {
      console.log('❌ No vendorSlug provided');
      return;
    }

    setLoading(true);

    try {
      // Check if vendorSlug is a UUID (vendor_id) or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorSlug);
      
      let query = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true);

      if (isUUID) {
        query = query.eq('id', vendorSlug);
      } else {
        query = query.eq('slug', vendorSlug);
      }

      const { data: vendorData, error: vendorError } = await query.single();

      if (vendorError || !vendorData) {
        console.error('❌ Vendor fetch error:', vendorError);
        setVendor(null);
        setLoading(false);
        return;
      }

      console.log('✅ Vendor found:', vendorData.business_name);

      // Fetch estate information if vendor has estate_id
      let estateInfo = null;
      if (vendorData.estate_id) {
        const { data: estateData, error: estateError } = await supabase
          .from('estates')
          .select('name, location')
          .eq('id', vendorData.estate_id)
          .single();

        if (!estateError && estateData) {
          estateInfo = estateData;
        }
      }

      // Fetch all products for this vendor
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('❌ Products fetch error:', productsError);
        throw productsError;
      }

      console.log('✅ Found', productsData?.length || 0, 'products');

      // Fetch subcategories for navigation
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('vendor_subcategories')
        .select('id, name, slug, category_id')
        .eq('vendor_id', vendorData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (subcategoriesError) {
        console.error('❌ Subcategories fetch error:', subcategoriesError);
      }

      console.log('✅ Found', subcategoriesData?.length || 0, 'subcategories');

      // Include estate info in vendor object
      const vendorWithEstate = {
        ...vendorData,
        estate_name: estateInfo?.name,
        estate_location: estateInfo?.location
      };

      setVendor(vendorWithEstate);
      setProducts(productsData || []);
      setSubcategories(subcategoriesData || []);

      // Filter products based on categorySlug
      let filtered = productsData || [];
      let catName = "All Products";

      if (categorySlug && categorySlug !== 'all') {
        // Find the subcategory by slug
        const subcategory = subcategoriesData?.find(sub => 
          sub.slug === categorySlug || 
          sub.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
        );

        if (subcategory) {
          catName = subcategory.name;
          // Filter products that match this subcategory
          filtered = productsData?.filter(p => 
            p.subcategory === subcategory.name || 
            p.category === subcategory.name
          ) || [];
        }
      }

      setCategoryName(catName);
      setFilteredProducts(filtered);

    } catch (error) {
      console.error('❌ Error fetching vendor data:', error);
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, [vendorSlug, categorySlug]);

  useEffect(() => {
    fetchVendorAndProducts();
  }, [vendorSlug, categorySlug, fetchVendorAndProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-48 w-full rounded-2xl mb-8" />
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
          <button onClick={() => navigate('/home')} className="text-primary hover:underline">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Create categories array for VendorNavbar
  const dbCategories = [
    { 
      id: "all", 
      slug: "all", 
      name: "All Products", 
      icon: Package, 
      productCount: products.length 
    },
    ...subcategories.map((sub) => ({
      id: sub.id,
      slug: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'),
      name: sub.name,
      icon: ShoppingBag,
      productCount: products.filter(p => p.subcategory === sub.name || p.category === sub.name).length
    }))
  ];

  return (
    <div className="min-h-screen bg-background">
      <VendorNavbar vendor={{ ...vendor, slug: vendorSlug, vendor_categories: dbCategories }} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/home')} className="cursor-pointer">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(`/vendor/${vendorSlug}`)} className="cursor-pointer">
                {vendor.business_name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{categoryName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
          <p className="text-muted-foreground">{filteredProducts.length} items available</p>
        </div>

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">All {categoryName}</h2>
            
            <div className="flex items-center gap-3">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-card border rounded-xl p-4 hover:shadow-lg transition-all">
                  <div className="aspect-square mb-3 bg-muted rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold mb-2 line-clamp-2">{product.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">KSh {product.price.toLocaleString()}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        addItem({
                          id: product.id,
                          vendorId: vendor.id,
                          vendorName: vendor.business_name,
                          name: product.name,
                          price: product.price,
                          quantity: 1,
                          image: product.image_url,
                        });
                        toast({
                          title: "Added to cart",
                          description: `1x ${product.name}`,
                        });
                      }}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold mb-2">No Products in this Category</h3>
              <p className="text-muted-foreground mb-4">
                This vendor hasn't added any products to {categoryName} yet.
              </p>
              <Button onClick={() => navigate(`/vendor/${vendorSlug}`)}>
                View All Products
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Floating Cart Button */}
      {getItemCount() > 0 && (
        <FloatingCartButton />
      )}
    </div>
  );
}