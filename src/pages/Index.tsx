import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Store, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/landing/Footer";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const Index = () => {
  const [products, setProducts] = useState<ProductWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const navigate = useNavigate();
  const { addItem, getItemCount } = useCart();
  const { toast } = useToast();

  // Fetch products with vendor info
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, description, category, subcategory, price, image_url, 
            is_available, vendor_id,
            vendor_profiles!inner (
              id, business_name, slug, is_approved, is_active
            )
          `)
          .eq('is_available', true)
          .eq('vendor_profiles.is_approved', true)
          .eq('vendor_profiles.is_active', true)
          .order('category', { ascending: true })
          .order('subcategory', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;

        // Transform data to expected format
        const transformedProducts: ProductWithVendor[] = (data || []).map((p: any) => ({
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
        }));

        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Extract unique categories and subcategories from products
  const categoriesWithProducts = useMemo(() => {
    const categoryMap = new Map<string, Set<string>>();
    
    products.forEach(product => {
      if (!categoryMap.has(product.category)) {
        categoryMap.set(product.category, new Set());
      }
      if (product.subcategory) {
        categoryMap.get(product.category)!.add(product.subcategory);
      }
    });
    
    // Sort alphabetically
    return Array.from(categoryMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, subcategories]) => ({
        name: category,
        subcategories: Array.from(subcategories).sort()
      }));
  }, [products]);

  // Get subcategories for selected category
  const currentSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const category = categoriesWithProducts.find(c => c.name === selectedCategory);
    return category?.subcategories || [];
  }, [selectedCategory, categoriesWithProducts]);

  // Filter products based on search and category/subcategory
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.vendor.business_name.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter(p => p.subcategory === selectedSubcategory);
    }
    
    return filtered;
  }, [products, searchQuery, selectedCategory, selectedSubcategory]);

  const handleAddToCart = (e: React.MouseEvent, product: ProductWithVendor) => {
    e.stopPropagation();
    
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
    if (product.vendor?.slug) {
      navigate(`/vendor/${product.vendor.slug}`);
    }
  };

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery("");
  };

  const cartCount = getItemCount();

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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/account')}
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/cart')}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/account')}
              >
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryClick(null)}
            className="whitespace-nowrap flex-shrink-0"
          >
            All Products
          </Button>
          {categoriesWithProducts.map(cat => (
            <Button
              key={cat.name}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(cat.name)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Subcategory Tabs (when category selected) */}
        {selectedCategory && currentSubcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            <Button
              variant={!selectedSubcategory ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedSubcategory(null)}
              className="whitespace-nowrap flex-shrink-0"
            >
              All {selectedCategory}
            </Button>
            {currentSubcategories.map(sub => (
              <Button
                key={sub}
                variant={selectedSubcategory === sub ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedSubcategory(sub)}
                className="whitespace-nowrap flex-shrink-0"
              >
                {sub}
              </Button>
            ))}
          </div>
        )}

        {/* Active Filters Summary */}
        {(selectedCategory || selectedSubcategory || searchQuery) && (
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
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {selectedCategory}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleCategoryClick(null)}
                />
              </Badge>
            )}
            {selectedSubcategory && (
              <Badge variant="secondary" className="gap-1">
                {selectedSubcategory}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSelectedSubcategory(null)}
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
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id}
                className="overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg h-full flex flex-col group"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🛍️
                    </div>
                  )}
                  {!product.is_available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2 flex-1">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-primary">
                        KES {product.price.toLocaleString()}
                      </span>
                      <Button
                        size="icon"
                        variant="default"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={!product.is_available}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                      <Store className="w-3 h-3" />
                      <span className="truncate">{product.vendor.business_name}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-4">
              No products match your current filters. Try adjusting your search or category.
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
