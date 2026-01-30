import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogIn, Plus, X, Store } from "lucide-react";
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

// Section filter options
const sectionFilters = [
  { id: null, label: "All", emoji: "🏠" },
  { id: "shop", label: "Shop", emoji: "🛒" },
  { id: "services", label: "Services", emoji: "📅" },
  { id: "health", label: "Health", emoji: "💊" },
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

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>{emoji}</span> {title}
      </h2>
      
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredProducts.map((product) => (
          <CompactProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
          />
        ))}
      </div>
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
    className="overflow-hidden cursor-pointer hover:border-primary transition-all group"
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
        <div className="w-full h-full flex items-center justify-center text-3xl">
          🛍️
        </div>
      )}
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


const Index = () => {
  const [products, setProducts] = useState<ProductWithVendor[]>([]);
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
      navigate("/auth/login", { state: { returnTo: "/" } });
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
      navigate("/auth/login", { state: { returnTo: "/" } });
      return;
    }

    if (product.vendor?.slug) {
      navigate(`/vendor/${product.vendor.slug}`);
    }
  };

  const clearFilters = () => {
    setSelectedSection(null);
    setSearchQuery("");
  };

  const cartCount = getItemCount();
  const totalProducts =
    visibleSections.shop.length +
    visibleSections.services.length +
    visibleSections.health.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Mtaaloop" className="h-8 w-8" />
                <span className="font-bold text-lg text-primary">Mtaaloop</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/auth/login")}
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
                className="pl-9 pr-4"
              />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Mtaaloop" className="h-10 w-10" />
              <span className="font-bold text-xl text-primary">Mtaaloop</span>
            </div>
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>
            <Button variant="outline" onClick={() => navigate("/auth/login")}>
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Section Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {sectionFilters.map((filter) => (
            <Button
              key={filter.id ?? "all"}
              variant={selectedSection === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSection(filter.id)}
              className="whitespace-nowrap flex-shrink-0 gap-1"
            >
              <span>{filter.emoji}</span>
              {filter.label}
            </Button>
          ))}
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
            <ProductSection
              title="Book a Service"
              emoji="📅"
              products={visibleSections.services}
              onAddToCart={handleAddToCart}
              onProductClick={handleProductClick}
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
            <div className="text-6xl mb-4">🔍</div>
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
