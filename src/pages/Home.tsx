import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Search, ShoppingBag, MapPin, Users, Stethoscope, ArrowRight, Calendar, CalendarCheck, Sparkles, Store } from "lucide-react";
import { ScrollAnimatedSection, ScrollAnimatedGrid } from "@/components/ScrollAnimations";
import { HOME_SERVICES_SHOWCASE } from "@/lib/serviceImages";
import { motion, useScroll, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApartmentSwitcher } from "@/components/ApartmentSwitcher";
import { useApartment } from "@/contexts/ApartmentContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VendorProfile } from "@/types/database";
import { VendorSpotlightBanner } from "@/components/home/VendorSpotlightBanner";
import { VendorShowcaseCard } from "@/components/home/VendorShowcaseCard";
import { BookingServicesSection } from "@/components/home/BookingServicesSection";

interface VendorWithCount extends VendorProfile {
  product_count?: number;
}

// Parallax service card component
const ParallaxServiceCard = ({ svc, onClick }: { svc: typeof HOME_SERVICES_SHOWCASE[number]; onClick: () => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15]);

  return (
    <Card
      ref={cardRef}
      className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
      onClick={onClick}
    >
      <div className="relative h-28 sm:h-36 overflow-hidden">
        <motion.img
          src={svc.image}
          alt={svc.title}
          className="absolute inset-0 w-full h-[130%] object-cover group-hover:brightness-110 transition-[filter] duration-500"
          style={{ y: imgY, scale: imgScale }}
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${svc.color} from-black/50 to-transparent`} />
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="font-bold text-sm sm:text-base text-white drop-shadow-lg">{svc.title}</h3>
          <p className="text-[10px] sm:text-xs text-white/80 line-clamp-1">{svc.description}</p>
        </div>
      </div>
    </Card>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { getItemCount, addItem } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [apartmentModalOpen, setApartmentModalOpen] = useState(false);
  const { currentApartment, setCurrentApartment } = useApartment();
  const [loadingPref, setLoadingPref] = useState(true);
  const [minimarts, setMinimarts] = useState<VendorProfile[]>([]);
  const [pharmacies, setPharmacies] = useState<VendorProfile[]>([]);
  const [bookingVendors, setBookingVendors] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Vendors state (replacing products)
  const [vendors, setVendors] = useState<VendorWithCount[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch user's apartment from DB on mount
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

        // Get their preference
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

  // Fetch all approved vendors with product counts
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoadingVendors(true);
        const { data, error } = await supabase
          .from("vendor_profiles")
          .select("*")
          .eq("is_approved", true)
          .eq("is_active", true)
          .order("rating", { ascending: false });

        if (error) throw error;

        const vendorIds = (data || []).map(v => v.id);
        const { data: counts } = await supabase
          .from("products")
          .select("vendor_id")
          .eq("is_available", true)
          .in("vendor_id", vendorIds);

        const countMap: Record<string, number> = {};
        (counts || []).forEach(c => {
          countMap[c.vendor_id] = (countMap[c.vendor_id] || 0) + 1;
        });

        const vendorsWithCounts: VendorWithCount[] = (data || []).map(v => ({
          ...v,
          product_count: countMap[v.id] || 0,
        }));

        setVendors(vendorsWithCounts);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  // Fetch minimarts
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
    if (!loadingPref) fetchMinimarts();
  }, [currentApartment, loadingPref]);

  // Fetch pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const { data, error } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('operational_category', 'pharmacy')
          .eq('is_approved', true)
          .eq('is_active', true)
          .limit(4);
        if (error) throw error;
        setPharmacies(data || []);
      } catch (error) {
        console.error('Failed to load pharmacies:', error);
      }
    };
    fetchPharmacies();
  }, []);

  // Fetch booking vendors
  useEffect(() => {
    const fetchBookingVendors = async () => {
      try {
        const { data: bVendors, error: vendorsError } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('operational_category', 'booking')
          .eq('is_approved', true)
          .eq('is_active', true)
          .limit(4);
        if (vendorsError) throw vendorsError;
        if (bVendors && bVendors.length > 0) {
          const vendorIds = bVendors.map(v => v.id);
          const { data: services } = await supabase
            .from('booking_service_types')
            .select('id, name, price, duration_minutes, category, vendor_id')
            .in('vendor_id', vendorIds)
            .eq('is_active', true)
            .order('price', { ascending: true });
          const vendorsWithServices = bVendors.map(vendor => ({
            ...vendor,
            services: services?.filter(s => s.vendor_id === vendor.id) || []
          }));
          setBookingVendors(vendorsWithServices);
        }
      } catch (error) {
        console.error('Failed to load booking vendors:', error);
      }
    };
    fetchBookingVendors();
  }, []);

  // Vendor category filter
  const vendorCategories = useMemo(() => {
    const cats = new Set<string>();
    vendors.forEach((v) => { if (v.business_type) cats.add(v.business_type); });
    return Array.from(cats).sort();
  }, [vendors]);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    let filtered = vendors;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.business_name.toLowerCase().includes(query) ||
        v.tagline?.toLowerCase().includes(query) ||
        v.business_type?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(v => v.business_type === selectedCategory);
    }
    return filtered;
  }, [vendors, searchQuery, selectedCategory]);

  const handleVendorClick = useCallback((vendor: VendorWithCount) => {
    navigate(`/vendor/${vendor.slug}`);
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

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
                      <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6 md:py-8 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <ScrollAnimatedSection direction="left" className="mb-4 sm:mb-6">
          <h1 className="text-xl md:text-3xl font-bold mb-1">
            Welcome to Mtaaloop
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Everything you need, delivered to your doorstep
          </p>
        </ScrollAnimatedSection>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products, vendors..."
              className="pl-12 h-11 md:h-12 text-base bg-background shadow-sm border-2 focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Featured Product Banner */}
        {!loadingProducts && products.length > 0 && (
          <FeaturedProductBanner 
            products={products} 
            onAddToCart={handleBannerAddToCart}
          />
        )}

        {/* Category Tabs */}
        {!loadingProducts && categories.length > 0 && (
          <CategoryTabsNav
            categories={categories}
            subcategories={subcategories}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSelectCategory={handleSelectCategory}
            onSelectSubcategory={setSelectedSubcategory}
          />
        )}

        {/* Products Count */}
        {!loadingProducts && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} 
            {selectedCategory ? ` in ${selectedCategory}` : ""}
            {selectedSubcategory ? ` › ${selectedSubcategory}` : ""}
          </p>
        )}

        {/* Product Grid */}
        <HomeProductGrid
          products={filteredProducts}
          loading={loadingProducts}
          selectedCategory={selectedCategory}
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />


        {/* ===== Services at Your Fingertips ===== */}
        <ScrollAnimatedSection direction="left" className="mb-8 mt-8 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-bold">Services at Your Fingertips</h2>
              <p className="text-xs md:text-sm text-muted-foreground">Book services, schedule appointments, get things done</p>
            </div>
          </div>
          <ScrollAnimatedGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {HOME_SERVICES_SHOWCASE.map((svc) => (
              <ParallaxServiceCard key={svc.title} svc={svc} onClick={() => navigate(svc.route)} />
            ))}
          </ScrollAnimatedGrid>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 gap-2"
            onClick={() => navigate('/quick-services')}
          >
            View All Services <ArrowRight className="h-4 w-4" />
          </Button>
        </ScrollAnimatedSection>

        {/* Health & Consultations Section */}
        {pharmacies.length > 0 && (
          <ScrollAnimatedSection direction="right" className="mb-8 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold">Health & Consultations</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Book pharmacy consultations with licensed professionals
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {pharmacies.map((pharmacy) => (
                <Card
                  key={pharmacy.id}
                  className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Login Required",
                        description: "Please login to book a consultation",
                        variant: "destructive",
                      });
                      navigate("/auth/login", { state: { returnTo: "/home" } });
                      return;
                    }
                    navigate(`/vendor/${pharmacy.slug}`);
                  }}
                >
                  <div className="relative h-24 md:h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {pharmacy.logo_url || pharmacy.cover_image_url ? (
                      <img
                        src={pharmacy.logo_url || pharmacy.cover_image_url}
                        alt={pharmacy.business_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Stethoscope className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-emerald-600 text-white text-xs">
                      {pharmacy.is_open ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm md:text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {pharmacy.business_name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {pharmacy.tagline || 'Professional health services'}
                    </p>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Calendar className="h-3 w-3" />
                      Book Consultation
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/categories/pharmacy')}
                className="gap-2"
              >
                View All Pharmacies
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Login Required",
                      description: "Please login to view your consultations",
                      variant: "destructive",
                    });
                    navigate("/auth/login", { state: { returnTo: "/my-consultations" } });
                    return;
                  }
                  navigate('/my-consultations');
                }}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                My Consultations
              </Button>
            </div>
          </ScrollAnimatedSection>
        )}

        {/* Booking Services Section */}
        <BookingServicesSection vendors={bookingVendors} />

        {/* Minimarts in Your Area */}
        {minimarts.length > 0 && (
          <div className="mt-8 mb-8">
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
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-3 right-3 bg-emerald-600 text-white hover:bg-emerald-700">
                      Open
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
          
          <Card 
            className="max-w-sm group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1" 
            onClick={() => navigate('/mtaaloop-mart')}
          >
            <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-primary/40" />
              </div>
              <Badge variant="secondary" className="absolute top-3 right-3 bg-emerald-600 text-white">Open</Badge>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-base md:text-lg group-hover:text-primary transition-colors">MtaaLoop Mart</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Your one-stop shop for essentials</p>
            </div>
          </Card>
        </div>
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
