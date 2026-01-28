import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { VendorNavbar } from "@/components/vendor/VendorNavbar";
import { supabase } from "@/integrations/supabase/client";
import { InventoryView } from "./views/InventoryView";
import { ServiceView } from "./views/ServiceView";
import { BookingView } from "./views/BookingView";
import { ShoppingBag, Package, Leaf, ArrowLeft, Star, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { VendorWithProducts, Product } from "@/types/database";

export default function VendorHome() {
  const { vendorSlug } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorWithProducts | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; slug: string; category_id: string }>>([]);
  const [loading, setLoading] = useState(true);

  const { addItem, getItemCount, getTotal } = useCart();
  const { toast } = useToast();

  const fetchVendorData = useCallback(async () => {
    if (!vendorSlug) {
      console.log('❌ No vendorSlug provided');
      return;
    }

    setLoading(true);

    try {
      // Check if vendorSlug is a UUID (vendor_id) or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorSlug);
      console.log('🔑 Is UUID?', isUUID, '| Value:', vendorSlug);

      // Try to find vendor by slug or id
      let query = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true);

      if (isUUID) {
        console.log('🔍 Searching by ID...');
        query = query.eq('id', vendorSlug);
      } else {
        console.log('🔍 Searching by slug...');
        query = query.eq('slug', vendorSlug);
      }

      const { data: vendorData, error: vendorError } = await query.single();

      console.log('📊 Database query result:', {
        found: !!vendorData,
        error: vendorError?.message,
        vendor: vendorData ? {
          id: vendorData.id,
          name: vendorData.business_name,
          slug: vendorData.slug
        } : null
      });

      if (vendorError) {
        console.error('❌ Database error:', vendorError);
        setVendor(null);
        setLoading(false);
        return;
      }

      if (!vendorData) {
        console.log('❌ No vendor found in database');
        setVendor(null);
        setLoading(false);
        return;
      }

      console.log('✅ Vendor found:', vendorData.business_name);

      // Fetch estate information if vendor has estate_id
      let estateInfo = null;
      if (vendorData.estate_id) {
        console.log('🏢 Fetching estate information...');
        const { data: estateData, error: estateError } = await supabase
          .from('estates')
          .select('name, location')
          .eq('id', vendorData.estate_id)
          .single();

        if (!estateError && estateData) {
          estateInfo = estateData;
          console.log('✅ Estate found:', estateData.name);
        }
      }

      // Fetch products for this vendor
      console.log('📦 Fetching products for vendor...');
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

      // Fetch subcategories for this vendor from vendor_subcategories table
      console.log('🏷️ Fetching subcategories for vendor...');
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

      // Extract unique categories and subcategories
      const uniqueCategories = new Set<string>();
      productsData?.forEach(product => {
        if (product.subcategory) {
          uniqueCategories.add(product.subcategory);
        } else if (product.category) {
          uniqueCategories.add(product.category);
        }
      });
      setCategories(['All', 'Popular', 'New Items', ...Array.from(uniqueCategories)]);

    } catch (error) {
      console.error('❌ Error fetching vendor:', error);
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, [vendorSlug]);

  useEffect(() => {
    fetchVendorData();
  }, [vendorSlug, fetchVendorData]);

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

        {/* Floating Cart Button */}
        {getItemCount() > 0 && (
          <FloatingCartButton />
        )}
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
          <button 
            onClick={() => navigate('/home')}
            className="text-primary hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Handle database vendor with same design as mock vendors
  const popularProducts = products.filter(p => p.is_popular);
  const newProducts = products.filter(p => p.is_new);

  // Create categories array with "All Products" and subcategories from database
  const dbCategories = [
    { 
      id: "all", 
      slug: "all", 
      name: "All Products", 
      icon: Package, 
      productCount: products.length 
    },
    ...subcategories.map((sub, index) => ({
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
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to {vendor.business_name}</h2>
          {vendor.tagline && (
            <p className="text-muted-foreground">{vendor.tagline}</p>
          )}
        </div>

        {/* Render the correct view based on operational_category */}
        {vendor.operational_category === 'inventory' && <InventoryView vendor={vendor} products={products} />}
        {vendor.operational_category === 'service' && <ServiceView vendor={vendor} products={products} />}
        {vendor.operational_category === 'booking' && <BookingView vendor={vendor} products={products} />}
        {!vendor.operational_category && <InventoryView vendor={vendor} products={products} />}

      </div>

      {/* Floating Cart Button */}
      {getItemCount() > 0 && (
        <FloatingCartButton />
      )}
    </div>
  );


}
