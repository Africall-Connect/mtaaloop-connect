import { ArrowLeft, Search, Star, ShoppingCart, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { VendorWithProducts } from "@/types/database";
import NotificationBell from "@/pages/NotificationBell";

// Simplified category type for navigation - only needs id, slug, name
interface NavCategory {
  id: string;
  slug: string;
  name: string;
}

interface VendorNavbarProps {
  vendor: Omit<VendorWithProducts, 'vendor_categories'> & {
    vendor_categories?: NavCategory[];
    estate_name?: string;
    business_type?: string;
  };
  selectedSubcategory: string | null;
  onSubcategoryChange: (slug: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function VendorNavbar({ 
  vendor, 
  selectedSubcategory,
  onSubcategoryChange,
  searchQuery,
  onSearchChange
}: VendorNavbarProps) {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const getFallbackImageUrl = () => {
    switch (vendor.business_type) {
      case 'food-drinks':
        return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
      case 'pharmacy':
        return "https://images.unsplash.com/photo-1555633514-abcee6ab92e1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHBoYXJtYWN5fGVufDB8fDB8fHww";
      case 'groceries-essentials':
        return "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2hvcHxlbnwwfHwwfHx8MA%3D%3D";
      case 'liquor-store':
        return "https://images.unsplash.com/photo-1582819509237-d5b75f20ff7a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8bGlxdW9yJTIwc3RvcmV8ZW58MHx8MHx8fDA%3D";
      default:
        return "";
    }
  };

  const imageUrl = vendor.logo_url || vendor.cover_image_url || getFallbackImageUrl();
  
  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-40">
      {/* Mtaalopp Top Bar */}
      <div className="bg-muted/50 border-b px-4 md:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Mtaaloop</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/account')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <User className="h-5 w-5 text-foreground" />
            </button>
            <NotificationBell vendorId={vendor.id} />
          </div>
        </div>
      </div>

      {/* Vendor Navbar */}
      <div className="px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Vendor Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={vendor.business_name}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-primary"
                />
              )}
              <div>
                <h1 className="text-lg md:text-2xl font-bold">{vendor.business_name}</h1>
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    <span>{vendor.rating || 0} ({vendor.review_count || 0})</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{vendor.estate_name || vendor.business_address || "Location not specified"}</span>
                  <span>•</span>
                  <span className={vendor.is_open ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                    {vendor.is_open ? "Open" : "Closed"}
                  </span>
                  {vendor.delivery_time && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{vendor.delivery_time}</span>
                    </>
                  )}
                </div>
                {vendor.tagline && (
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">{vendor.tagline}</p>
                )}
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4 md:mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search in ${vendor.business_name}...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search products...`}
                className="pl-10 h-10"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs - Client-side filtering, no page reload */}
          {vendor.vendor_categories && vendor.vendor_categories.length > 0 && (
            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {vendor.vendor_categories.map((category) => {
                const isAllProducts = category.slug === 'all';
                const isActive = isAllProducts 
                  ? selectedSubcategory === null
                  : selectedSubcategory === category.slug;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      // Call callback instead of navigating
                      onSubcategoryChange(isAllProducts ? null : category.slug);
                    }}
                    className={cn(
                      "whitespace-nowrap px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base snap-start min-w-fit",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
