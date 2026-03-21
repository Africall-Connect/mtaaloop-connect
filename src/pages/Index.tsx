import { useState, useEffect, useMemo } from "react";
import { MtaaLoopOrbit } from "@/components/MtaaLoopLogo";
import { useNavigate } from "react-router-dom";
import { Search, LogIn, Plus, X, Store, CalendarCheck, Clock, Sparkles, ShoppingCart, Home, Pill } from "lucide-react";
import { getServiceImage } from "@/lib/serviceImages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/landing/Footer";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getOperationalType } from "@/lib/categories";
import { DURATION_OPTIONS } from "@/types/booking";
import { ScrollAnimatedGrid, ScrollAnimatedSection } from "@/components/ScrollAnimations";

interface ProductWithVendor {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  vendor_id: string;
  vendor: {
    id: string;
    business_name: string;
    slug: string;
  };
}

interface BookingServiceWithVendor {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  vendor_id: string;
  vendor: {
    id: string;
    business_name: string;
    slug: string;
  };
}

// Section filter options with Lucide icons
const sectionFilters = [
  { id: null, label: "All", icon: Home },
  { id: "shop", label: "Shop", icon: ShoppingCart },
  { id: "services", label: "Services", icon: CalendarCheck },
  { id: "health", label: "Health", icon: Pill },
];

// Product Section Component with category tabs
const ProductSection = ({
  title,
  emoji,
  products,
  onAddToCart,
  onProductClick,
}: {
  title: string;
  emoji: string;
  products: ProductWithVendor[];
  onAddToCart: (e: React.MouseEvent, product: ProductWithVendor) => void;
  onProductClick: (product: ProductWithVendor) => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories in this section
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => cats.add(p.category));
    return Array.from(cats).sort();
  }, [products]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  if (products.length === 0) return null;

  // Get icon based on title
  const SectionIcon = title === "Shop Now" ? ShoppingCart : title === "Health & Pharmacy" ? Pill : CalendarCheck;
  
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <SectionIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">Browse our selection</p>
        </div>
      </div>
      
      {/* Category tabs within section */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
          <Button
            variant={!selectedCategory ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap flex-shrink-0 text-xs h-7"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap flex-shrink-0 text-xs h-7"
            >
              {cat}
            </Button>
          ))}
        </div>
      )}
      
      <ScrollAnimatedGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredProducts.map((product) => (
          <CompactProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
          />
        ))}
      </ScrollAnimatedGrid>
    </section>
  );
};

// Compact Product Card Component
const CompactProductCard = ({
  product,
  onAddToCart,
  onProductClick,
}: {
  product: ProductWithVendor;
  onAddToCart: (e: React.MouseEvent, product: ProductWithVendor) => void;
  onProductClick: (product: ProductWithVendor) => void;
}) => (
  <Card
    className="overflow-hidden cursor-pointer border-primary/10 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
    onClick={() => onProductClick(product)}
  >
    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <ShoppingCart className="w-8 h-8 text-primary/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {!product.is_available && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
        </div>
      )}
    </div>
    <div className="p-2">
      <h3 className="font-medium text-xs line-clamp-1 group-hover:text-primary transition-colors">
        {product.name}
      </h3>
      <div className="flex items-center justify-between mt-1">
        <span className="text-sm font-bold text-primary">
          KES {product.price.toLocaleString()}
        </span>
        <Button
          size="icon"
          variant="default"
          className="h-6 w-6 rounded-full"
          onClick={(e) => onAddToCart(e, product)}
          disabled={!product.is_available}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
        <Store className="w-2.5 h-2.5" />
        <span className="truncate">{product.vendor.business_name}</span>
      </div>
    </div>
  </Card>
);

// Booking Service Card Component for landing page
const BookingServiceCard = ({
  service,
  onServiceClick,
}: {
  service: BookingServiceWithVendor;
  onServiceClick: (service: BookingServiceWithVendor) => void;
}) => {
  const getDurationLabel = (minutes: number) => {
    return DURATION_OPTIONS.find(d => d.value === minutes)?.label || `${minutes} min`;
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer border-primary/10 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
      onClick={() => onServiceClick(service)}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={getServiceImage(service.category || service.name)}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {service.category && (
          <Badge variant="secondary" className="absolute top-2 left-2 text-xs bg-background/80 backdrop-blur-sm">
            {service.category}
          </Badge>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-medium text-xs line-clamp-1 group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            <span>{getDurationLabel(service.duration_minutes)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-primary">
            KES {service.price.toLocaleString()}
          </span>
          <Button
            size="sm"
            variant="default"
            className="h-6 px-2 text-xs rounded"
          >
            <CalendarCheck className="h-3 w-3 mr-1" />
            Book
          </Button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
          <Store className="w-2.5 h-2.5" />
          <span className="truncate">{service.vendor.business_name}</span>
        </div>
      </div>
    </Card>
  );
};

// Booking Services Section Component
const BookingServicesSection = ({
  title,
  emoji,
  services,
  onServiceClick,
}: {
  title: string;
  emoji: string;
  services: BookingServiceWithVendor[];
  onServiceClick: (service: BookingServiceWithVendor) => void;
}) => {
  if (services.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <CalendarCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">Book appointments and services</p>
        </div>
      </div>
      
      <ScrollAnimatedGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {services.map((service) => (
          <BookingServiceCard
            key={service.id}
            service={service}
            onServiceClick={onServiceClick}
          />
        ))}
      </ScrollAnimatedGrid>
    </section>
  );
};


const Index = () => {
  const [products, setProducts] = useState<ProductWithVendor[]>([]);
  const [bookingServices, setBookingServices] = useState<BookingServiceWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const { addItem, getItemCount } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch products with vendor info
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select(
            `
            id, name, description, category, subcategory, price, image_url, 
            is_available, vendor_id,
            vendor_profiles!inner (
              id, business_name, slug, is_approved, is_active
            )
          `
          )
          .eq("is_available", true)
          .eq("vendor_profiles.is_approved", true)
          .eq("vendor_profiles.is_active", true)
          .order("category", { ascending: true })
          .order("subcategory", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;

        const transformedProducts: ProductWithVendor[] = (data || []).map(
          (p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            subcategory: p.subcategory,
            price: p.price,
            image_url: p.image_url,
            is_available: p.is_available,
            vendor_id: p.vendor_id,
            vendor: {
              id: p.vendor_profiles.id,
              business_name: p.vendor_profiles.business_name,
              slug: p.vendor_profiles.slug,
            },
          })
        );

        setProducts(transformedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch booking services
  useEffect(() => {
    const fetchBookingServices = async () => {
      try {
        const { data, error } = await supabase
          .from('booking_service_types')
          .select(`
            id, name, description, price, duration_minutes, category, vendor_id,
            vendor_profiles!inner (id, business_name, slug, is_approved, is_active)
          `)
          .eq('is_active', true)
          .eq('vendor_profiles.is_approved', true)
          .eq('vendor_profiles.is_active', true)
          .order('price', { ascending: true })
          .limit(12);
        
        if (!error && data) {
          const transformed: BookingServiceWithVendor[] = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            duration_minutes: s.duration_minutes,
            category: s.category,
            vendor_id: s.vendor_id,
            vendor: {
              id: s.vendor_profiles.id,
              business_name: s.vendor_profiles.business_name,
              slug: s.vendor_profiles.slug,
            },
          }));
          setBookingServices(transformed);
        }
      } catch (error) {
        console.error('Error fetching booking services:', error);
      }
    };

    fetchBookingServices();
  }, []);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.vendor.business_name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Group products by section
  const productsBySection = useMemo(() => {
    const sections = {
      shop: [] as ProductWithVendor[],
      services: [] as ProductWithVendor[],
      health: [] as ProductWithVendor[],
    };

    filteredProducts.forEach((product) => {
      const opType = getOperationalType(product.category);
      if (opType === "inventory") {
        sections.shop.push(product);
      } else if (opType === "service" || opType === "booking") {
        sections.services.push(product);
      } else if (opType === "pharmacy") {
        sections.health.push(product);
      } else {
        // Fallback: add to shop
        sections.shop.push(product);
      }
    });

    return sections;
  }, [filteredProducts]);

  // Filter visible sections based on selection
  const visibleSections = useMemo(() => {
    if (!selectedSection) return productsBySection;
    return {
      shop: selectedSection === "shop" ? productsBySection.shop : [],
      services: selectedSection === "services" ? productsBySection.services : [],
      health: selectedSection === "health" ? productsBySection.health : [],
    };
  }, [selectedSection, productsBySection]);

  const handleAddToCart = (e: React.MouseEvent, product: ProductWithVendor) => {
    e.stopPropagation();

    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your cart",
        variant: "destructive",
      });
      navigate("/auth/login", { state: { returnTo: "/marketplace" } });
      return;
    }

    addItem({
      id: product.id,
      vendorId: product.vendor_id,
      vendorName: product.vendor.business_name,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url || undefined,
      category: product.category,
    });

    toast({
      title: "Added to cart",
      description: `1x ${product.name}`,
    });
  };

  const handleProductClick = (product: ProductWithVendor) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to view product details",
        variant: "destructive",
      });
      navigate("/auth/login", { state: { returnTo: "/marketplace" } });
      return;
    }

    if (product.vendor?.slug) {
      navigate(`/vendor/${product.vendor.slug}`);
    }
  };

  const handleBookingServiceClick = (service: BookingServiceWithVendor) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a service",
        variant: "destructive",
      });
      navigate("/auth/login", { state: { returnTo: "/marketplace" } });
      return;
    }

    if (service.vendor?.slug) {
      navigate(`/vendor/${service.vendor.slug}`);
    }
  };

  const clearFilters = () => {
    setSelectedSection(null);
    setSearchQuery("");
  };

  const cartCount = getItemCount();
  
  // Visible booking services based on selection and search
  const visibleBookingServices = useMemo(() => {
    if (selectedSection && selectedSection !== 'services') return [];
    
    if (!searchQuery.trim()) return bookingServices;
    
    const query = searchQuery.toLowerCase();
    return bookingServices.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query) ||
        s.vendor.business_name.toLowerCase().includes(query)
    );
  }, [bookingServices, selectedSection, searchQuery]);
  
  const totalProducts =
    visibleSections.shop.length +
    visibleBookingServices.length +
    visibleSections.health.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 border-b border-primary/10 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <MtaaLoopPin size={32} />
                <span className="font-bold text-lg text-primary">Mtaaloop</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/auth/login")}
                className="border-primary/20 hover:border-primary/40"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 border-primary/20 focus:border-primary/40"
              />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1">
              <MtaaLoopPin size={40} />
              <span className="font-bold text-xl text-primary">Mtaaloop</span>
            </div>
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 border-primary/20 focus:border-primary/40"
              />
            </div>
            <Button variant="outline" onClick={() => navigate("/auth/login")} className="border-primary/20 hover:border-primary/40">
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Section Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {sectionFilters.map((filter) => {
            const FilterIcon = filter.icon;
            return (
              <Button
                key={filter.id ?? "all"}
                variant={selectedSection === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSection(filter.id)}
                className={`whitespace-nowrap flex-shrink-0 gap-1.5 ${
                  selectedSection === filter.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background border-primary/20 hover:border-primary/40"
                }`}
              >
                <FilterIcon className="h-3.5 w-3.5" />
                {filter.label}
              </Button>
            );
          })}
        </div>

        {/* Active Filters Summary */}
        {(selectedSection || searchQuery) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                "{searchQuery}"
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {selectedSection && (
              <Badge variant="secondary" className="gap-1">
                {sectionFilters.find((f) => f.id === selectedSection)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedSection(null)}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {totalProducts} product{totalProducts !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Product Sections */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-2 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : totalProducts > 0 ? (
          <>
            <ProductSection
              title="Shop Now"
              emoji="🛒"
              products={visibleSections.shop}
              onAddToCart={handleAddToCart}
              onProductClick={handleProductClick}
            />
            {/* Booking Services Section - using actual booking_service_types data */}
            <BookingServicesSection
              title="Book a Service"
              emoji="📅"
              services={visibleBookingServices}
              onServiceClick={handleBookingServiceClick}
            />
            <ProductSection
              title="Health & Pharmacy"
              emoji="💊"
              products={visibleSections.health}
              onAddToCart={handleAddToCart}
              onProductClick={handleProductClick}
            />
          </>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <Search className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-4">
              No products match your current filters. Try adjusting your search.
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
