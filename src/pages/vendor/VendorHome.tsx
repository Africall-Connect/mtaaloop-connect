import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { VendorNavbar } from "@/components/vendor/VendorNavbar";
import { supabase } from "@/integrations/supabase/client";
import { InventoryView } from "./views/InventoryView";
import { ServiceView } from "./views/ServiceView";
import { BookingView } from "./views/BookingView";
import { PharmacyView } from "./views/PharmacyView";
import { ShoppingBag, Package, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { VendorWithProducts, Product } from "@/types/database";
import { VendorThemeProvider } from "@/components/vendor/VendorThemeProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = 'popular' | 'price-low' | 'price-high' | 'newest' | 'name';

export default function VendorHome() {
  const { vendorSlug } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorWithProducts | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; slug: string; category_id: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Client-side filtering state
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const { getItemCount } = useCart();

  const fetchVendorData = useCallback(async () => {
    if (!vendorSlug) {
      console.log('❌ No vendorSlug provided');
      return;
    }

    setLoading(true);

    try {
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
        console.error('❌ Database error:', vendorError);
        setVendor(null);
        setLoading(false);
        return;
      }

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

      // Fetch products for this vendor
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

      // Fetch subcategories for this vendor from vendor_subcategories table
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('vendor_subcategories')
        .select('id, name, slug, category_id')
        .eq('vendor_id', vendorData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (subcategoriesError) {
        console.error('❌ Subcategories fetch error:', subcategoriesError);
      }

      const vendorWithEstate = {
        ...vendorData,
        estate_name: estateInfo?.name,
        estate_location: estateInfo?.location
      };

      setVendor(vendorWithEstate);
      setProducts(productsData || []);
      setSubcategories(subcategoriesData || []);

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

  // Create categories array with "All Products" and subcategories from database
  const dbCategories = useMemo(() => [
    { 
      id: "all", 
      slug: "all", 
      name: "All Products", 
      productCount: products.length 
    },
    ...subcategories.map((sub) => ({
      id: sub.id,
      slug: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'),
      name: sub.name,
      productCount: products.filter(p => p.subcategory === sub.name || p.category === sub.name).length
    }))
  ], [products, subcategories]);

  // Filter and sort products client-side
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by subcategory
    if (selectedSubcategory) {
      const subcategoryInfo = subcategories.find(s => s.slug === selectedSubcategory);
      if (subcategoryInfo) {
        result = result.filter(p => 
          p.subcategory === subcategoryInfo.name || 
          p.category === subcategoryInfo.name
        );
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
      default:
        result.sort((a, b) => {
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          return (b.orders_this_week || 0) - (a.orders_this_week || 0);
        });
        break;
    }

    return result;
  }, [products, selectedSubcategory, searchQuery, sortBy, subcategories]);

  // Get the active subcategory name for display
  const activeSubcategoryName = useMemo(() => {
    if (!selectedSubcategory) return null;
    const subcategoryInfo = subcategories.find(s => s.slug === selectedSubcategory);
    return subcategoryInfo?.name || selectedSubcategory;
  }, [selectedSubcategory, subcategories]);

  // Get fallback image URL for hero banner
  const getHeroImageUrl = () => {
    if (vendor?.cover_image_url) return vendor.cover_image_url;
    if (vendor?.banner_url) return vendor.banner_url;
    
    switch (vendor?.business_type) {
      case 'food-drinks':
        return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop";
      case 'pharmacy':
        return "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&auto=format&fit=crop";
      case 'groceries-essentials':
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop";
      case 'liquor-store':
        return "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=1200&auto=format&fit=crop";
      default:
        return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop";
    }
  };

  if (loading) {
    return (
      <VendorThemeProvider vendor={vendor}>
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
            <Skeleton className="h-48 w-full rounded-2xl mb-8" />
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          </div>

          {getItemCount() > 0 && (
            <FloatingCartButton />
          )}
        </div>
      </VendorThemeProvider>
    );
  }

  if (!vendor) {
    return (
      <VendorThemeProvider vendor={null}>
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
            <p className="text-muted-foreground mb-4">The vendor you're looking for doesn't exist or is no longer available.</p>
            <Button 
              onClick={() => navigate('/home')}
              className="gap-2"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </VendorThemeProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <VendorNavbar 
        vendor={{ ...vendor, slug: vendorSlug, vendor_categories: dbCategories }} 
        selectedSubcategory={selectedSubcategory}
        onSubcategoryChange={setSelectedSubcategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Hero Banner */}
      <div className="relative h-40 md:h-56 overflow-hidden">
        <img
          src={getHeroImageUrl()}
          alt={vendor.business_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground drop-shadow-sm">
              Welcome to {vendor.business_name}
            </h2>
            {vendor.tagline && (
              <p className="text-sm md:text-lg text-muted-foreground mt-1 max-w-2xl">
                {vendor.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-[140px] md:top-[180px] z-30 bg-background/95 backdrop-blur-sm border-b px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''} 
              {activeSubcategoryName && (
                <span className="hidden sm:inline"> in <span className="text-primary font-medium">{activeSubcategoryName}</span></span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[140px] md:w-[180px] h-9 text-xs md:text-sm">
                  <ArrowUpDown className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Render the correct view based on operational_category */}
        {vendor.operational_category === 'inventory' && <InventoryView vendor={vendor} products={filteredProducts} />}
        {vendor.operational_category === 'service' && <ServiceView vendor={vendor} products={filteredProducts} />}
        {vendor.operational_category === 'booking' && <BookingView vendor={vendor} products={filteredProducts} />}
        {vendor.operational_category === 'pharmacy' && <PharmacyView vendor={vendor} products={filteredProducts} />}
        {!vendor.operational_category && <InventoryView vendor={vendor} products={filteredProducts} />}
      </div>

      {/* Floating Cart Button */}
      {getItemCount() > 0 && (
        <FloatingCartButton />
      )}
    </div>
  );
}
