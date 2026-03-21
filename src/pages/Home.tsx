import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Search, ShoppingBag, MapPin, Users, Stethoscope, ArrowRight, Calendar, CalendarCheck, Sparkles, Store, ChevronRight, Zap, Home as HomeIcon, Heart, Droplets, Check } from "lucide-react";
import { ScrollAnimatedSection, ScrollAnimatedGrid } from "@/components/ScrollAnimations";
import { HOME_SERVICES_SHOWCASE, ServiceShowcaseItem } from "@/lib/serviceImages";
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
  featured_products?: { id: string; name: string; image_url: string | null; price: number }[];
}

// Parallax service card component
const ParallaxServiceCard = ({ svc, onClick, index }: { svc: typeof HOME_SERVICES_SHOWCASE[number]; onClick: () => void; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.05, 1.12]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card
        className="group overflow-hidden cursor-pointer border-0 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 bg-card"
        onClick={onClick}
      >
        <div className="relative h-32 sm:h-40 overflow-hidden">
          <motion.img
            src={svc.image}
            alt={svc.title}
            className="absolute inset-0 w-full h-[130%] object-cover group-hover:brightness-110 transition-[filter] duration-500"
            style={{ y: imgY, scale: imgScale }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <h3 className="font-bold text-sm sm:text-base text-white drop-shadow-lg leading-tight">{svc.title}</h3>
            <p className="text-[11px] sm:text-xs text-white/80 line-clamp-1 mt-0.5">{svc.description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Section header component for consistency
const SectionHeader = ({ icon: Icon, title, subtitle, action, onAction }: { 
  icon: React.ElementType; title: string; subtitle: string; action?: string; onAction?: () => void 
}) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-primary/10 rounded-xl">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg md:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    {action && onAction && (
      <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary/80 hidden sm:flex" onClick={onAction}>
        {action} <ChevronRight className="h-4 w-4" />
      </Button>
    )}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
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
  const [vendors, setVendors] = useState<VendorWithCount[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch user's apartment from DB on mount
  useEffect(() => {
    const loadUserApartment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoggedIn(false); setLoadingPref(false); return; }
        setIsLoggedIn(true);
        const { data: profileData } = await supabase
          .from("customer_profiles").select("avatar_url").eq("user_id", user.id).maybeSingle();
        if (profileData?.avatar_url) setUserAvatar(profileData.avatar_url);
        const { data: pref, error } = await supabase
          .from("user_preferences")
          .select(`estate_id, apartment_name, house_name, estates (id, name, location)`)
          .eq("user_id", user.id).maybeSingle();
        if (error) { console.error("Error loading user_preferences:", error); setLoadingPref(false); return; }
        if (pref && !pref.estate_id) {
          setCurrentApartment({ id: "general-location", name: "General Location", unitCount: 0, hasPhases: false });
          setLoadingPref(false); return;
        }
        if (pref && pref.estate_id) {
          const estateName = pref.estates?.[0]?.name || pref.apartment_name || "Selected Estate";
          setCurrentApartment({ id: pref.estate_id, name: estateName, unitCount: 0, hasPhases: false, house_name: pref.house_name || undefined });
          setLoadingPref(false); return;
        }
        setLoadingPref(false);
      } catch (err) { console.error("Error loading apartment preference:", err); setLoadingPref(false); }
    };
    loadUserApartment();
  }, [setCurrentApartment]);

  // Fetch all approved vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoadingVendors(true);
        const { data, error } = await supabase.from("vendor_profiles").select("*")
          .eq("is_approved", true).eq("is_active", true).order("rating", { ascending: false });
        if (error) throw error;
        const vendorIds = (data || []).map(v => v.id);
        const { data: allProducts } = await supabase.from("products")
          .select("id, vendor_id, name, image_url, price, is_available")
          .eq("is_available", true).in("vendor_id", vendorIds)
          .order("created_at", { ascending: false }).limit(1000);
        const countMap: Record<string, number> = {};
        const featuredMap: Record<string, { id: string; name: string; image_url: string | null; price: number }[]> = {};
        (allProducts || []).forEach(p => {
          countMap[p.vendor_id] = (countMap[p.vendor_id] || 0) + 1;
          if (!featuredMap[p.vendor_id]) featuredMap[p.vendor_id] = [];
          if (featuredMap[p.vendor_id].length < 8 && p.image_url) {
            featuredMap[p.vendor_id].push({ id: p.id, name: p.name, image_url: p.image_url, price: p.price });
          }
        });
        setVendors((data || []).map(v => ({ ...v, product_count: countMap[v.id] || 0, featured_products: featuredMap[v.id] || [] })));
      } catch (error) { console.error("Error fetching vendors:", error); }
      finally { setLoadingVendors(false); }
    };
    fetchVendors();
  }, []);

  // Fetch minimarts
  useEffect(() => {
    const fetchMinimarts = async () => {
      try {
        let query = supabase.from('vendor_profiles').select('*')
          .eq('is_approved', true).eq('is_active', true).eq('operational_category', 'minimart');
        if (currentApartment && currentApartment.id !== 'general-location') query = query.eq('estate_id', currentApartment.id);
        const { data, error } = await query.limit(3);
        if (error) throw error;
        setMinimarts(data || []);
      } catch (error) { console.error('Failed to load minimarts:', error); }
    };
    if (!loadingPref) fetchMinimarts();
  }, [currentApartment, loadingPref]);

  // Fetch pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const { data, error } = await supabase.from('vendor_profiles').select('*')
          .eq('operational_category', 'pharmacy').eq('is_approved', true).eq('is_active', true).limit(4);
        if (error) throw error;
        setPharmacies(data || []);
      } catch (error) { console.error('Failed to load pharmacies:', error); }
    };
    fetchPharmacies();
  }, []);

  // Fetch booking vendors
  useEffect(() => {
    const fetchBookingVendors = async () => {
      try {
        const { data: bVendors, error: vendorsError } = await supabase.from('vendor_profiles').select('*')
          .eq('operational_category', 'booking').eq('is_approved', true).eq('is_active', true).limit(4);
        if (vendorsError) throw vendorsError;
        if (bVendors && bVendors.length > 0) {
          const vendorIds = bVendors.map(v => v.id);
          const { data: services } = await supabase.from('booking_service_types')
            .select('id, name, price, duration_minutes, category, vendor_id')
            .in('vendor_id', vendorIds).eq('is_active', true).order('price', { ascending: true });
          setBookingVendors(bVendors.map(vendor => ({ ...vendor, services: services?.filter(s => s.vendor_id === vendor.id) || [] })));
        }
      } catch (error) { console.error('Failed to load booking vendors:', error); }
    };
    fetchBookingVendors();
  }, []);

  const vendorCategories = useMemo(() => {
    const cats = new Set<string>();
    vendors.forEach(v => { if (v.business_type) cats.add(v.business_type); });
    return Array.from(cats).sort();
  }, [vendors]);

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
    if (selectedCategory) filtered = filtered.filter(v => v.business_type === selectedCategory);
    return filtered;
  }, [vendors, searchQuery, selectedCategory]);

  const handleVendorClick = useCallback((vendor: VendorWithCount) => {
    navigate(`/vendor/${vendor.slug}`);
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-2.5 md:py-3 max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Logo & Location */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <img src="/logo.png" alt="Mtaaloop" className="h-6 w-6 md:h-7 md:w-7 object-contain" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Mtaaloop
                </span>
                <button
                  onClick={() => setApartmentModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-none font-medium">
                    {currentApartment?.name || "Select Location"}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/mtaaloop')}>
                <Users className="h-4 w-4" /> Connect
              </Button>
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
                  <ShoppingBag className="h-5 w-5" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                      {getItemCount()}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center overflow-hidden">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">U</span>
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-4 py-5 md:py-8 max-w-6xl mx-auto space-y-8 md:space-y-10">
        {/* ─── Welcome + Search ─── */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Welcome to Mtaaloop
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Everything you need, delivered to your doorstep
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stores, products..."
                className="pl-11 h-12 text-base bg-muted/50 border-0 shadow-sm focus:bg-background focus:shadow-md focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.form>
        </div>

        {/* ─── Vendor Spotlight ─── */}
        {!loadingVendors && vendors.length > 0 && (
          <VendorSpotlightBanner vendors={vendors as any} />
        )}

        {/* ─── Store Category Chips ─── */}
        {!loadingVendors && vendorCategories.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              <Button
                size="sm"
                variant={selectedCategory === null ? "default" : "outline"}
                className={`rounded-full text-xs whitespace-nowrap flex-shrink-0 h-8 px-4 font-medium transition-all duration-200 ${
                  selectedCategory === null ? "shadow-md shadow-primary/25" : ""
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All Stores
              </Button>
              {vendorCategories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={`rounded-full text-xs whitespace-nowrap flex-shrink-0 capitalize h-8 px-4 font-medium transition-all duration-200 ${
                    selectedCategory === cat ? "shadow-md shadow-primary/25" : ""
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  {cat.replace(/-/g, " ")}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredVendors.length}</span> store{filteredVendors.length !== 1 ? "s" : ""} 
                {selectedCategory ? ` in ${selectedCategory.replace(/-/g, " ")}` : " available"}
              </p>
            </div>
          </div>
        )}

        {/* ─── Vendor Grid ─── */}
        {loadingVendors ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-sm">
                <div className="h-36 sm:h-44 bg-muted animate-pulse" />
                <div className="p-3.5 space-y-2.5">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/80 flex items-center justify-center">
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No stores found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {selectedCategory ? `No stores in "${selectedCategory.replace(/-/g, " ")}". Try another category!` : "Check back soon for new stores!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredVendors.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
              >
                <VendorShowcaseCard vendor={vendor} onClick={() => handleVendorClick(vendor)} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── Services at Your Fingertips ─── */}
        <section>
          <SectionHeader
            icon={Sparkles}
            title="Services at Your Fingertips"
            subtitle="Book services, schedule appointments, get things done"
            action="View All"
            onAction={() => navigate('/quick-services')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {HOME_SERVICES_SHOWCASE.map((svc, i) => (
              <ParallaxServiceCard key={svc.title} svc={svc} onClick={() => navigate(svc.route)} index={i} />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-5 gap-2 sm:hidden rounded-full"
            onClick={() => navigate('/quick-services')}
          >
            View All Services <ArrowRight className="h-4 w-4" />
          </Button>
        </section>

        {/* ─── Health & Consultations ─── */}
        {pharmacies.length > 0 && (
          <section>
            <SectionHeader
              icon={Stethoscope}
              title="Health & Consultations"
              subtitle="Book pharmacy consultations with licensed professionals"
              action="All Pharmacies"
              onAction={() => navigate('/categories/pharmacy')}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pharmacies.map((pharmacy, i) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card
                    className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-400 hover:-translate-y-1"
                    onClick={() => {
                      if (!user) {
                        toast({ title: "Login Required", description: "Please login to book a consultation", variant: "destructive" });
                        navigate("/auth/login", { state: { returnTo: "/home" } });
                        return;
                      }
                      navigate(`/vendor/${pharmacy.slug}`);
                    }}
                  >
                    <div className="relative h-28 md:h-36 overflow-hidden bg-muted">
                      {pharmacy.logo_url || pharmacy.cover_image_url ? (
                        <img src={pharmacy.logo_url || pharmacy.cover_image_url} alt={pharmacy.business_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Stethoscope className="w-10 h-10 text-primary/30" />
                        </div>
                      )}
                      <Badge className={`absolute top-2 right-2 text-[10px] ${
                        pharmacy.is_open ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"
                      }`}>
                        {pharmacy.is_open ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-bold text-sm md:text-base mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
                        {pharmacy.business_name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">
                        {pharmacy.tagline || 'Professional health services'}
                      </p>
                      <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Calendar className="h-3.5 w-3.5" />
                        Book Consultation
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <Button variant="outline" size="sm" className="gap-2 rounded-full"
                onClick={() => navigate('/categories/pharmacy')}>
                View All Pharmacies <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="gap-2 rounded-full"
                onClick={() => {
                  if (!user) {
                    toast({ title: "Login Required", description: "Please login to view your consultations", variant: "destructive" });
                    navigate("/auth/login", { state: { returnTo: "/my-consultations" } });
                    return;
                  }
                  navigate('/my-consultations');
                }}>
                <Calendar className="h-4 w-4" /> My Consultations
              </Button>
            </div>
          </section>
        )}

        {/* ─── Booking Services ─── */}
        <BookingServicesSection vendors={bookingVendors} />

        {/* ─── Minimarts ─── */}
        {minimarts.length > 0 && (
          <section>
            <SectionHeader
              icon={ShoppingBag}
              title="Minimarts in Your Area"
              subtitle={`Convenience stores near ${currentApartment?.name || 'you'}`}
            />
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
              {minimarts.map((minimart, i) => (
                <motion.div
                  key={minimart.id}
                  className="min-w-[260px] md:min-w-0 snap-start"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Card
                    className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-400 hover:-translate-y-1 h-full"
                    onClick={() => navigate(`/minimart/${minimart.id}`)}
                  >
                    <div className="relative h-36 md:h-44 overflow-hidden bg-muted">
                      {minimart.cover_image_url || minimart.logo_url ? (
                        <img src={minimart.cover_image_url || minimart.logo_url} alt={minimart.business_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <ShoppingBag className="w-12 h-12 text-primary/20" />
                        </div>
                      )}
                      <Badge className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px]">Open</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-1">
                        {minimart.business_name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {minimart.tagline || 'Your one-stop shop for all essentials.'}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ─── MtaaLoop Essentials ─── */}
        <section>
          <SectionHeader
            icon={Store}
            title="MtaaLoop Essentials"
            subtitle="Our shop, always available for you"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card
              className="max-w-sm group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-400 hover:-translate-y-1"
              onClick={() => navigate('/mtaaloop-mart')}
            >
              <div className="relative h-36 md:h-44 overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingBag className="w-14 h-14 text-primary/40 mx-auto mb-2" />
                    <span className="text-xs font-medium text-primary/60">MtaaLoop Mart</span>
                  </div>
                </div>
                <Badge className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px]">Open</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-base group-hover:text-primary transition-colors">MtaaLoop Mart</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Your one-stop shop for essentials</p>
              </div>
            </Card>
          </motion.div>
        </section>
      </div>

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
