import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Search, ShoppingBag, UtensilsCrossed, Pill, Sparkles, 
  Home as HomeIcon, Droplet, MapPin, Star, Clock, TrendingUp, 
  Wine, Hotel, Package, Trash2, Users 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApartmentSwitcher } from "@/components/ApartmentSwitcher";
import { useApartment } from "@/contexts/ApartmentContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { VendorProfile } from "@/types/database";
import { VendorSpotlight } from "@/components/VendorSpotlight";

// Official 10 categories + Trash Collection
const categories = [
  {
    icon: UtensilsCrossed,
    name: "Food & Drinks",
    subtitle: "Fast Food, Traditional, Cafes & More",
    link: "/food-drinks",
    gradient: "from-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80"
  },
  {
    icon: Package,
    name: "Living Essentials",
    subtitle: "Toiletries, Cleaning & Household",
    link: "/living-essentials",
    gradient: "from-cyan-500 to-blue-500",
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80"
  },
  {
    icon: ShoppingBag,
    name: "Groceries & Food",
    subtitle: "Fresh Produce, Meat, Dairy & Snacks",
    link: "/groceries-food",
    gradient: "from-green-500 to-emerald-500",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"
  },
  {
    icon: UtensilsCrossed,
    name: "Restaurant",
    subtitle: "Dine-in Experience & Custom Menus",
    link: "/restaurant",
    gradient: "from-amber-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80"
  },
  {
    icon: Wine,
    name: "Liquor Store",
    subtitle: "Beer, Wine, Spirits & Beverages",
    link: "/liquor-store",
    gradient: "from-red-600 to-rose-500",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=80"
  },
  {
    icon: Droplet,
    name: "Utilities & Services",
    subtitle: "Gas & Water Delivery",
    link: "/utilities-services",
    gradient: "from-blue-600 to-sky-500",
    image: "https://images.unsplash.com/photo-1585687433448-e0d7cba3c0a5?w=500&q=80"
  },
  {
    icon: HomeIcon,
    name: "Home Services",
    subtitle: "Cleaning, Laundry & Electrical",
    link: "/home-services",
    gradient: "from-teal-500 to-green-500",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80"
  },
  {
    icon: Sparkles,
    name: "Beauty & Spa",
    subtitle: "Hair, Nails, Massage & Makeup",
    link: "/beauty-spa",
    gradient: "from-pink-500 to-purple-500",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80"
  },
  {
    icon: Hotel,
    name: "Accommodation",
    subtitle: "Guest Houses, Airbnb & Rentals",
    link: "/accommodation",
    gradient: "from-indigo-500 to-violet-500",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80"
  },
  {
    icon: Pill,
    name: "Pharmacy",
    subtitle: "Medicines, Consultations & Care",
    link: "/pharmacy",
    gradient: "from-sky-500 to-cyan-400",
    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&q=80"
  },
  {
    icon: Trash2,
    name: "Trash Collection",
    subtitle: "Quick doorstep pickup - KSh 30",
    link: "/trash-collection",
    gradient: "from-emerald-600 to-teal-700",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80"
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [apartmentModalOpen, setApartmentModalOpen] = useState(false);
  const { currentApartment, setCurrentApartment } = useApartment();
  const [loadingPref, setLoadingPref] = useState(true);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [minimarts, setMinimarts] = useState<VendorProfile[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState<VendorProfile[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [categoriesWithData, setCategoriesWithData] = useState<Set<string>>(new Set());

  // fetch user's apartment from DB on mount
  useEffect(() => {
    const loadUserApartment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoggedIn(false);
          setLoadingPref(false);
          return;
        }

        setIsLoggedIn(true);

        // Fetch user avatar from customer_profiles
        const { data: profileData } = await supabase
          .from("customer_profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profileData?.avatar_url) {
          setUserAvatar(profileData.avatar_url);
        }

        // get their preference
        const { data: pref, error } = await supabase
          .from("user_preferences")
          .select(`
            estate_id,
            apartment_name,
            house_name,
            estates (
              id,
              name,
              location
            )
          `)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading user_preferences:", error);
          setLoadingPref(false);
          return;
        }

        if (pref && !pref.estate_id) {
          setCurrentApartment({
            id: "general-location",
            name: "General Location",
            unitCount: 0,
            hasPhases: false,
          });
          setLoadingPref(false);
          return;
        }

        if (pref && pref.estate_id) {
          const estateName = pref.estates?.[0]?.name || pref.apartment_name || "Selected Estate";
          setCurrentApartment({
            id: pref.estate_id,
            name: estateName,
            unitCount: 0,
            hasPhases: false,
            house_name: pref.house_name || undefined,
          });
          setLoadingPref(false);
          return;
        }

        setLoadingPref(false);
      } catch (err) {
        console.error("Error loading apartment preference:", err);
        setLoadingPref(false);
      }
    };

    loadUserApartment();
  }, [setCurrentApartment]);

  // Fetch vendors from database
  useEffect(() => {
    const fetchMinimarts = async () => {
      try {
        let query = supabase
          .from('vendor_profiles')
          .select('*')
          .eq('is_approved', true)
          .eq('is_active', true)
          .eq('operational_category', 'minimart');

        if (currentApartment && currentApartment.id !== 'general-location') {
          query = query.eq('estate_id', currentApartment.id);
        }

        const { data, error } = await query.limit(3);
        if (error) throw error;
        setMinimarts(data || []);
      } catch (error) {
        console.error('Failed to load minimarts:', error);
      }
    };

    const fetchVendors = async () => {
      try {
        setLoadingVendors(true);
        
        const query = supabase
          .from('vendor_profiles')
          .select('*')
          .eq('is_approved', true)
          .eq('is_active', true)
          .order('rating', { ascending: false });

        if (currentApartment && currentApartment.id !== 'general-location') {
          const { data, error } = await query.eq('estate_id', currentApartment.id).limit(12);
          if (error) throw error;
          setVendors(data || []);
        } else {
          const { data, error } = await query.limit(12);
          if (error) throw error;
          setVendors(data || []);
        }
      } catch (error) {
        console.error('Failed to load vendors:', error);
      } finally {
        setLoadingVendors(false);
      }
    };

    // Fetch categories that have vendors
    const fetchCategoriesWithData = async () => {
      try {
        let query = supabase
          .from('vendor_profiles')
          .select('business_type')
          .eq('is_approved', true)
          .eq('is_active', true);

        if (currentApartment && currentApartment.id !== 'general-location') {
          query = query.eq('estate_id', currentApartment.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map business_type to category names
        const categorySet = new Set<string>();
        data?.forEach(vendor => {
          const bt = vendor.business_type?.toLowerCase() || '';
          // Map vendor business types to our category names
          if (bt.includes('food') || bt.includes('restaurant') || bt.includes('cafe') || bt.includes('fast food')) {
            categorySet.add('Food & Drinks');
          }
          if (bt.includes('restaurant') || bt === 'restaurant') {
            categorySet.add('Restaurant');
          }
          if (bt.includes('grocery') || bt.includes('groceries') || bt.includes('supermarket')) {
            categorySet.add('Groceries & Food');
          }
          if (bt.includes('living') || bt.includes('essential') || bt.includes('toiletries') || bt.includes('household')) {
            categorySet.add('Living Essentials');
          }
          if (bt.includes('liquor') || bt.includes('wine') || bt.includes('beer') || bt.includes('spirits')) {
            categorySet.add('Liquor Store');
          }
          if (bt.includes('utility') || bt.includes('gas') || bt.includes('water delivery')) {
            categorySet.add('Utilities & Services');
          }
          if (bt.includes('home service') || bt.includes('cleaning') || bt.includes('laundry') || bt.includes('electrical')) {
            categorySet.add('Home Services');
          }
          if (bt.includes('beauty') || bt.includes('spa') || bt.includes('salon') || bt.includes('barber') || bt.includes('nail')) {
            categorySet.add('Beauty & Spa');
          }
          if (bt.includes('accommodation') || bt.includes('airbnb') || bt.includes('guest house') || bt.includes('rental')) {
            categorySet.add('Accommodation');
          }
          if (bt.includes('pharmacy') || bt.includes('chemist') || bt.includes('medicine')) {
            categorySet.add('Pharmacy');
          }
        });

        // Always include Trash Collection as a special service
        categorySet.add('Trash Collection');

        setCategoriesWithData(categorySet);
      } catch (error) {
        console.error('Failed to load category data:', error);
      }
    };

    if (!loadingPref) {
      fetchVendors();
      fetchMinimarts();
      fetchCategoriesWithData();
    }
  }, [currentApartment, loadingPref]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Filter vendors based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVendors(vendors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = vendors.filter(vendor => 
      vendor.business_name.toLowerCase().includes(query) ||
      vendor.tagline?.toLowerCase().includes(query) ||
      vendor.business_type.toLowerCase().includes(query)
    );
    setFilteredVendors(filtered);
  }, [searchQuery, vendors]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container px-4 py-2 md:py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Location */}
            <div className="flex items-center gap-2 md:gap-3">
              <img 
                src="/logo.png" 
                alt="Mtaaloop Logo" 
                className="h-8 w-8 md:h-10 md:w-10 object-contain" 
              />
              <div className="min-w-0">
                <span className="text-lg md:text-xl font-bold text-primary">Mtaaloop</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 hidden sm:block flex-shrink-0" />
                  <span className="font-medium text-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
                    {currentApartment?.name || "Select Location"}
                  </span>
                  <button
                    onClick={() => setApartmentModalOpen(true)}
                    className="text-primary hover:underline ml-1 flex-shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-2"
                onClick={() => navigate('/mtaaloop')}
              >
                <Users className="h-4 w-4" />
                <span>Connect</span>
              </Button>
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6 md:py-8 max-w-6xl mx-auto">
        {/* Welcome Section - More compact on mobile */}
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-bold mb-1">
            Welcome to Mtaaloop
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Everything you need, delivered to your doorstep
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mb-6 md:mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vendors, products, services..."
              className="pl-12 h-12 md:h-14 text-base bg-background shadow-sm border-2 focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Vendor Spotlight - Top Rated Vendors */}
        {!loadingVendors && vendors.length > 0 && (
          <VendorSpotlight vendors={vendors} />
        )}

        {/* Location Info Bar - More compact on mobile */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 md:mb-8 px-2">
          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium text-muted-foreground">
              {currentApartment && currentApartment.id !== 'general-location' 
                ? `Live in ${currentApartment.name}` 
                : 'Live in Your Area'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="font-medium">
              {loadingVendors ? 'Loading...' : `${vendors.length} vendors`}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">
              {currentApartment && currentApartment.id !== 'general-location' ? '0-500m' : '500m'} radius
            </span>
          </div>
        </div>

        {/* Categories - Official 11 categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-2xl font-bold">What are you looking for?</h2>
          </div>
          
          {/* Mobile: 2 columns, Desktop: 3 columns - Only show categories with data */}
          {categories.filter(cat => categoriesWithData.has(cat.name)).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {categories
                .filter(category => categoriesWithData.has(category.name))
                .map((category) => (
                  <Link key={category.name} to={category.link}>
                    <Card className="group relative overflow-hidden h-28 md:h-40 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundImage: `url(${category.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
                      
                      {/* Content */}
                      <div className="relative p-3 md:p-4 h-full flex flex-col justify-end">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-white/20 backdrop-blur-sm p-1.5 md:p-2 mb-2">
                          <category.icon className="w-full h-full text-white" />
                        </div>
                        <h3 className="text-sm md:text-base font-bold text-white line-clamp-1">
                          {category.name}
                        </h3>
                        <p className="text-xs text-white/80 line-clamp-1 hidden md:block">
                          {category.subtitle}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No vendors available in your area yet.</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </div>
          )}
        </div>

        {/* Minimarts in Your Area */}
        {minimarts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-bold">Minimarts in Your Area</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Convenience stores near {currentApartment?.name || 'you'}
                </p>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
              {minimarts.map((minimart) => (
                <Card
                  key={minimart.id}
                  className="min-w-[260px] md:min-w-0 snap-start group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => navigate(`/minimart/${minimart.id}`)}
                >
                  <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {minimart.cover_image_url || minimart.logo_url ? (
                      <img
                        src={minimart.cover_image_url || minimart.logo_url}
                        alt={minimart.business_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        🏪
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-base md:text-lg mb-1 group-hover:text-primary transition-colors">
                      {minimart.business_name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                      {minimart.tagline || 'Your one-stop shop for all essentials.'}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* MtaaLoop Essentials Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-2xl font-bold">MtaaLoop Essentials</h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Our shop, always available for you
              </p>
            </div>
          </div>
          
          {/* MtaaLoop Mart Only */}
          <Card 
            className="max-w-sm group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1" 
            onClick={() => navigate('/mtaaloop-mart')}
          >
            <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="w-full h-full flex items-center justify-center text-5xl">🛒</div>
              <Badge className="absolute top-3 right-3 bg-green-600">🟢 Open</Badge>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-base md:text-lg group-hover:text-primary transition-colors">MtaaLoop Mart</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Your one-stop shop for essentials</p>
            </div>
          </Card>
        </div>

        {/* Featured Vendors Section */}
        {!loadingVendors && filteredVendors.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-bold">Popular Vendors Near You</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {searchQuery ? `${filteredVendors.length} results for "${searchQuery}"` : `Top rated businesses in ${currentApartment?.name || 'your area'}`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
              {filteredVendors.slice(0, 6).map((vendor) => (
                <Card
                  key={vendor.id}
                  className="min-w-[260px] md:min-w-0 snap-start group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => navigate(`/vendor/${vendor.id}`)}
                >
                  <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {vendor.cover_image_url || vendor.logo_url ? (
                      <img
                        src={vendor.cover_image_url || vendor.logo_url}
                        alt={vendor.business_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        🏪
                      </div>
                    )}
                    {vendor.is_active && (
                      <Badge className="absolute top-3 right-3 bg-green-600">
                        🟢 Open
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base md:text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {vendor.business_name}
                    </h3>

                    {vendor.tagline && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                        {vendor.tagline}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {vendor.rating?.toFixed(1) || '4.5'}
                        </span>
                        {vendor.review_count > 0 && (
                          <span className="text-muted-foreground">
                            ({vendor.review_count})
                          </span>
                        )}
                      </div>

                      {vendor.delivery_time && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{vendor.delivery_time}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {vendor.business_type}
                      </Badge>
                      {vendor.delivery_fee !== null && (
                        <span className="text-xs text-muted-foreground">
                          KSh {vendor.delivery_fee} delivery
                        </span>
                      )}
                    </div>

                    {vendor.rating >= 4.5 && vendor.total_orders > 50 && (
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        <TrendingUp className="w-3 h-3" />
                        <span>Popular in your area</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading State for Vendors */}
        {loadingVendors && (
          <div className="mb-8">
            <h2 className="text-lg md:text-2xl font-bold mb-4">Loading vendors...</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-32 md:h-40 bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apartment Switcher Modal */}
      <ApartmentSwitcher
        open={apartmentModalOpen}
        onOpenChange={setApartmentModalOpen}
        currentApartment={currentApartment}
        onApartmentSelect={setCurrentApartment}
      />
    </div>
  );
};

export default Home;
