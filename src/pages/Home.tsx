import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, UtensilsCrossed, Pill, Sparkles, Home as HomeIcon, Car, Droplet, Gift, MapPin, Star, Clock, TrendingUp, Wine, Wrench, Shirt, Laptop, Dumbbell, GraduationCap, Music, Briefcase, PawPrint, Flower2, BookOpen, Baby, Truck, Hotel, Package, Shield, Church, Palette, HardHat, Sprout, Trash2, Heart, Video, Users } from "lucide-react";
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
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAllVendors, setShowAllVendors] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState<VendorProfile[]>([]);
  const [showAllBusinessCards, setShowAllBusinessCards] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // fetch user's apartment from DB on mount
  useEffect(() => {
    const loadUserApartment = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // not logged in → keep localStorage apartment
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
        
        console.log('Home page - fetched profile data:', profileData);
        
        if (profileData?.avatar_url) {
          console.log('Setting user avatar:', profileData.avatar_url);
          setUserAvatar(profileData.avatar_url);
        } else {
          console.log('No avatar_url found in profile');
        }

        // get their preference
        const { data: pref, error } = await supabase
          .from("user_preferences")
          .select(
            `
            estate_id,
            apartment_name,
            house_name,
            estates (
              id,
              name,
              location
            )
          `
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading user_preferences:", error);
          setLoadingPref(false);
          return;
        }

        // if user picked "general location" earlier → estate_id is null
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

        // if they have a real estate_id
        if (pref && pref.estate_id) {
          // prefer joined estate name if available
          // Note: estates is a joined object from Supabase, accessed as an array join
          const estateName = pref.estates?.[0]?.name || pref.apartment_name || "Selected Estate";

          setCurrentApartment({
            id: pref.estate_id,
            name: estateName,
            // we don't know phases from here yet, so keep them simple
            unitCount: 0,
            hasPhases: false,
            house_name: pref.house_name || undefined,
          });

          setLoadingPref(false);
          return;
        }

        // no pref row → leave current context/localStorage
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

        // Filter by estate if user has selected one
        if (currentApartment && currentApartment.id !== 'general-location') {
          const { data, error } = await query.eq('estate_id', currentApartment.id).limit(12);

          if (error) {
            console.error('Error fetching vendors:', error);
            throw error;
          }

          setVendors(data || []);
        } else {
          const { data, error } = await query.limit(12);

          if (error) {
            console.error('Error fetching vendors:', error);
            throw error;
          }

          setVendors(data || []);
        }
      } catch (error) {
        console.error('Failed to load vendors:', error);
        // Don't show toast error, just silently fail
      } finally {
        setLoadingVendors(false);
      }
    };

    if (!loadingPref) {
      fetchVendors();
      fetchMinimarts();
    }
  }, [currentApartment, loadingPref]);

  // Fetch available categories based on vendors in user's location
  useEffect(() => {
    const fetchAvailableCategories = async () => {
      try {
        setLoadingCategories(true);

        const query = supabase
          .from('vendor_categories')
          .select('name')
          .eq('is_active', true);

        // If user has a specific estate, join with vendor_profiles to filter
        if (currentApartment && currentApartment.id !== 'general-location') {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendor_profiles')
            .select('id')
            .eq('estate_id', currentApartment.id)
            .eq('is_approved', true)
            .eq('is_active', true);

          if (vendorError) throw vendorError;

          const vendorIds = vendorData?.map(v => v.id) || [];

          if (vendorIds.length > 0) {
            // Get categories that have vendors in this location
            const { data: categoryData, error: categoryError } = await supabase
              .from('vendor_categories')
              .select('name')
              .in('vendor_id', vendorIds)
              .eq('is_active', true);

            if (categoryError) throw categoryError;

            // Get unique category names
            const uniqueCategories = [...new Set(categoryData?.map(c => c.name) || [])];
            setAvailableCategories(uniqueCategories);
          } else {
            setAvailableCategories([]);
          }
        } else {
          // Show all categories if no specific location selected
          const { data, error } = await supabase
            .from('vendor_categories')
            .select('name')
            .eq('is_active', true);

          if (error) throw error;

          const uniqueCategories = [...new Set(data?.map(c => c.name) || [])];
          setAvailableCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Show all categories on error
        setAvailableCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (!loadingPref) {
      fetchAvailableCategories();
    }
  }, [currentApartment, loadingPref]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter is handled by useEffect below
  };

  // MtaaLoop businesses data for filtering
  const mtaaLoopBusinesses = [
    { name: 'MtaaLoop Mart', route: '/mtaaloop-mart', category: 'Convenience Store', description: 'Your one-stop shop for all essentials.' },
  ];

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

  const categories = [
    {
      icon: UtensilsCrossed,
      name: "Food & Drinks",
      subtitle: "Traditional, Fast Food, Juices & More",
      link: "/food-drinks-db",
      gradient: "from-orange-500 to-red-500",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80"
    },
    {
      icon: ShoppingBag,
      name: "Groceries & Essentials",
      subtitle: "Daily necessities and household items",
      link: "/shopping-db",
      gradient: "from-blue-500 to-cyan-500",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"
    },
    {
      icon: Pill,
      name: "Health & Wellness",
      subtitle: "Pharmacy, Medicine & Health Products",
      link: "/health-db",
      gradient: "from-green-500 to-emerald-500",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&q=80"
    },
    {
      icon: Sparkles,
      name: "Beauty & Spa",
      subtitle: "Hair, Nails, Massage & Makeup",
      link: "/beauty-db",
      gradient: "from-pink-500 to-purple-500",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80"
    },
    {
      icon: Car,
      name: "Auto Services",
      subtitle: "Car Wash, Repairs & Maintenance",
      link: "/transport-db",
      gradient: "from-slate-500 to-gray-500",
      image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&q=80"
    },
    {
      icon: Wine,
      name: "Liquor Store",
      subtitle: "Wine, Beer, Spirits & Beverages",
      link: "/liquor-db",
      gradient: "from-red-600 to-rose-500",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=80"
    },
    {
      icon: HomeIcon,
      name: "Home Services",
      subtitle: "Cleaning, Plumbing & Home Care",
      link: "/home-services-db",
      gradient: "from-teal-500 to-green-500",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80"
    },
    {
      icon: Wrench,
      name: "Repairs & Maintenance",
      subtitle: "Electronics, Appliances & More",
      link: "/repairs-db",
      gradient: "from-amber-500 to-orange-600",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&q=80"
    },
    {
      icon: Shirt,
      name: "Fashion & Clothing",
      subtitle: "Apparel, Shoes & Accessories",
      link: "/fashion-db",
      gradient: "from-violet-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80"
    },
    {
      icon: Laptop,
      name: "Electronics & Gadgets",
      subtitle: "Phones, Computers & Tech",
      link: "/electronics-db",
      gradient: "from-blue-600 to-indigo-600",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80"
    },
    {
      icon: Dumbbell,
      name: "Fitness & Sports",
      subtitle: "Gyms, Training & Sports Equipment",
      link: "/fitness-db",
      gradient: "from-red-500 to-orange-500",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80"
    },
    {
      icon: GraduationCap,
      name: "Education & Tutoring",
      subtitle: "Classes, Tutors & Learning",
      link: "/education-db",
      gradient: "from-blue-500 to-sky-500",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80"
    },
    {
      icon: Music,
      name: "Event & Entertainment",
      subtitle: "DJ, Photography & Event Planning",
      link: "/events-db",
      gradient: "from-purple-500 to-pink-600",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80"
    },
    {
      icon: Briefcase,
      name: "Professional Services",
      subtitle: "Legal, Accounting & Consulting",
      link: "/professional-db",
      gradient: "from-gray-600 to-slate-700",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80"
    },
    {
      icon: PawPrint,
      name: "Pet Services",
      subtitle: "Veterinary, Grooming & Pet Care",
      link: "/pets-db",
      gradient: "from-amber-500 to-yellow-500",
      image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=500&q=80"
    },
    {
      icon: Flower2,
      name: "Home & Garden",
      subtitle: "Plants, Furniture & Decor",
      link: "/home-garden-db",
      gradient: "from-green-600 to-lime-600",
      image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&q=80"
    },
    {
      icon: BookOpen,
      name: "Books & Stationery",
      subtitle: "Books, Office Supplies & More",
      link: "/books-db",
      gradient: "from-indigo-500 to-blue-600",
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80"
    },
    {
      icon: Baby,
      name: "Baby & Kids",
      subtitle: "Baby Care, Toys & Children Items",
      link: "/baby-kids-db",
      gradient: "from-pink-400 to-rose-400",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80"
    },
    {
      icon: Truck,
      name: "Transport & Logistics",
      subtitle: "Moving, Delivery & Transport",
      link: "/logistics-db",
      gradient: "from-orange-600 to-red-600",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80"
    },
    {
      icon: Hotel,
      name: "Accommodation",
      subtitle: "Hotels, Airbnb & Short Stays",
      link: "/accommodation-db",
      gradient: "from-teal-600 to-cyan-600",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80"
    },
    {
      icon: Gift,
      name: "Flowers & Gifts",
      subtitle: "Flowers, Gift Baskets & More",
      link: "/flowers-gifts-db",
      gradient: "from-rose-500 to-pink-500",
      image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=500&q=80"
    },
    {
      icon: Package,
      name: "Utilities & Services",
      subtitle: "Bill Payments, Airtime & More",
      link: "/utilities-db",
      gradient: "from-gray-500 to-zinc-600",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&q=80"
    },
    {
      icon: Shield,
      name: "Security Services",
      subtitle: "Guards, CCTV & Alarm Systems",
      link: "/security-db",
      gradient: "from-red-700 to-red-900",
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&q=80"
    },
    {
      icon: Church,
      name: "Religious Services",
      subtitle: "Churches, Mosques & Spiritual",
      link: "/religious-db",
      gradient: "from-blue-700 to-indigo-800",
      image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=500&q=80"
    },
    {
      icon: Palette,
      name: "Creative Services",
      subtitle: "Design, Video & Content Creation",
      link: "/creative-db",
      gradient: "from-fuchsia-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80"
    },
    {
      icon: HardHat,
      name: "Construction Services",
      subtitle: "Building, Masonry & Construction",
      link: "/construction-db",
      gradient: "from-yellow-600 to-orange-700",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80"
    },
    {
      icon: Sprout,
      name: "Agriculture & Farming",
      subtitle: "Farm Produce & Agricultural Supplies",
      link: "/agriculture-db",
      gradient: "from-lime-600 to-green-700",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&q=80"
    },
    {
      icon: Trash2,
      name: "Trash Collection",
      subtitle: "Quick doorstep pickup - KSh 30",
      link: "/trash-collection",
      gradient: "from-emerald-600 to-teal-700",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80"
    },
    {
      icon: Heart,
      name: "Wedding Services",
      subtitle: "Wedding Planning & Bridal Services",
      link: "/wedding-db",
      gradient: "from-pink-500 to-rose-600",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80"
    },
    {
      icon: Gift,
      name: "Special Occasions",
      subtitle: "Gifts, Events & Celebrations",
      link: "/special-occasions-db",
      gradient: "from-rose-500 to-pink-500",
      image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80"
    },
    {
      icon: Pill,
      name: "Pharmacy",
      subtitle: "Medication, Supplements & Personal Care",
      link: "/pharmacy-db",
      gradient: "from-sky-500 to-cyan-400",
      image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGhhcm1hY3l8ZW58MHx8MHx8fDA%3D"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Mtaaloop Logo" 
                className="h-20 w-20 object-contain" 
              />
              <div>
                <span className="text-2xl font-bold text-primary">Mtaaloop</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="font-medium text-foreground">
                    {currentApartment
                      ? `${currentApartment.name}${currentApartment.phase ? ` Phase ${currentApartment.phase}` : ""}`
                      : "Select Apartment"}
                  </span>
                  <button
                    onClick={() => {
                      console.log("🔘 Change button clicked");
                      setApartmentModalOpen(true);
                    }}
                    className="text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => navigate('/mtaaloop')}
              >
                <Users className="h-5 w-5" />
                <Video className="h-5 w-5" />
                <span className="hidden md:inline">Connect</span>
              </Button>
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="icon">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-4 py-8 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome to Your Building's Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">
            Everything you need from vendors in your building and nearby businesses
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vendors, products, services..."
              className="pl-12 h-14 text-base bg-background shadow-sm border-2 focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Vendor Spotlight - Top Rated Vendors */}
        {!loadingVendors && vendors.length > 0 && (
          <VendorSpotlight vendors={vendors} />
        )}

        {/* Location Info Bar */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              {currentApartment && currentApartment.id !== 'general-location' 
                ? `Live in ${currentApartment.name}` 
                : 'Live in Your Area'}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm font-medium">
              {loadingVendors ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${vendors.length} vendors active`
              )}
            </span>
            {!loadingCategories && currentApartment && currentApartment.id !== 'general-location' && (
              <>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {availableCategories.length} categories
                </span>
              </>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">
              {currentApartment && currentApartment.id !== 'general-location' ? '0-500m' : '500m'} radius
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">What are you looking for?</h2>
              {currentApartment && currentApartment.id !== 'general-location' && !loadingCategories && (
                <p className="text-sm text-muted-foreground mt-1">
                  {showAllCategories 
                    ? `Showing all categories` 
                    : availableCategories.length > 0 
                      ? `Showing ${availableCategories.length} categories available in ${currentApartment.name}`
                      : `No categories available in ${currentApartment.name}`
                  }
                </p>
              )}
            </div>
            {currentApartment && currentApartment.id !== 'general-location' && availableCategories.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories ? 'Show Available Only' : 'Show All Categories'}
              </Button>
            )}
          </div>
          
          {loadingCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-40 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories
                .filter(category => {
                  // Trash Collection is always available (like MtaaLoop Mart)
                  if (category.name === "Trash Collection") {
                    return true;
                  }
                  // If showing all or no specific location, show all categories
                  if (showAllCategories || !currentApartment || currentApartment.id === 'general-location') {
                    return true;
                  }
                  // Otherwise, only show categories available in the location
                  return availableCategories.length === 0 || availableCategories.includes(category.name);
                })
                .map((category) => {
                  // Trash Collection is always available (like MtaaLoop Mart)
                  const isAlwaysAvailable = category.name === "Trash Collection";
                  
                  const isAvailable = isAlwaysAvailable ||
                                     availableCategories.includes(category.name) || 
                                     !currentApartment || 
                                     currentApartment.id === 'general-location' ||
                                     showAllCategories;
                  const isUnavailable = !isAlwaysAvailable &&
                                       currentApartment && 
                                       currentApartment.id !== 'general-location' && 
                                       !showAllCategories &&
                                       availableCategories.length > 0 &&
                                       !availableCategories.includes(category.name);

                  return (
                    <Link key={category.name} to={category.link} className={isUnavailable ? 'pointer-events-none' : ''}>
                      <Card className={`group relative overflow-hidden h-full cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 ${isUnavailable ? 'opacity-50' : ''}`}>
                        {/* Badge for unavailable categories */}
                        {isUnavailable && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge variant="secondary" className="text-xs">
                              Not available nearby
                            </Badge>
                          </div>
                        )}

                        {/* Badge for available categories when viewing all */}
                        {showAllCategories && isAvailable && currentApartment && currentApartment.id !== 'general-location' && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge variant="default" className="text-xs bg-green-600">
                              ✓ Available
                            </Badge>
                          </div>
                        )}

                        {/* Background Image with Overlay */}
                        {category.image && (
                          <>
                            <div 
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                              style={{ backgroundImage: `url(${category.image})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
                          </>
                        )}
                        
                        {/* Gradient Background Fallback (if no image) */}
                        {!category.image && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        )}
                        
                        <div className="relative p-6 space-y-3">
                          <div className={`w-14 h-14 rounded-xl ${category.image ? 'bg-white/20 backdrop-blur-sm' : `bg-gradient-to-br ${category.gradient}`} p-3 shadow-lg`}>
                            <category.icon className={`w-full h-full ${category.image ? 'text-white' : 'text-white'}`} />
                          </div>
                          
                          <div>
                            <h3 className={`text-lg font-bold mb-1 transition-colors ${category.image ? 'text-white' : 'text-foreground group-hover:text-primary'}`}>
                              {category.name}
                            </h3>
                            <p className={`text-sm line-clamp-2 ${category.image ? 'text-white/90' : 'text-muted-foreground'}`}>
                              {category.subtitle}
                            </p>
                          </div>

                          <div className={`flex items-center text-sm font-medium transition-opacity ${category.image ? 'text-white' : 'text-primary'} opacity-0 group-hover:opacity-100`}>
                            {isUnavailable ? 'Not available →' : 'Browse options →'}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>

      {minimarts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Minimarts in Your Area</h2>
              <p className="text-sm text-muted-foreground">
                Convenience stores near {currentApartment?.name || 'you'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {minimarts.map((minimart) => (
              <Card
                key={minimart.id}
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(`/minimart/${minimart.id}`)}
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {minimart.cover_image_url || minimart.logo_url ? (
                    <img
                      src={minimart.cover_image_url || minimart.logo_url}
                      alt={minimart.business_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🏪
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    {minimart.business_name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {minimart.tagline || 'Your one-stop shop for all essentials.'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

        {/* Featured Vendors Section */}
        {!loadingVendors && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Popular Vendors Near You</h2>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? `${filteredVendors.length} results for "${searchQuery}"` : `Top rated businesses in ${currentApartment?.name || 'your area'}`}
                </p>
              </div>
              {!searchQuery && (
                <Button variant="outline" onClick={() => setShowAllBusinessCards(!showAllBusinessCards)}>
                  {showAllBusinessCards ? 'Show Less' : 'View All'} →
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* MtaaLoop Mart Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-mart')}
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🛒
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        MtaaLoop Mart
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        Your one-stop shop for all essentials.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Convenience Store
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Cards 4-39: Show only when View All is clicked and not searching */}
              {!searchQuery && showAllBusinessCards && (
                <>
              {/* MtaaLoop Pharmacy Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-pharmacy')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&h=300&fit=crop" 
                    alt="Pharmacy" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Pharmacy
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Medicines, prescriptions, health products
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Health & Wellness
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Restaurant Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-restaurant')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop" 
                    alt="Restaurant" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Restaurant
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Hot meals, food delivery
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Restaurant
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Butchery Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-butchery')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=300&fit=crop" 
                    alt="Butchery" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Butchery
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Fresh meat, chicken, fish
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Butchery
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Hardware Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-hardware')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&h=300&fit=crop" 
                    alt="Hardware" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Hardware
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Tools, paint, construction materials
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Hardware
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Salon Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-salon')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&h=300&fit=crop" 
                    alt="Salon" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Salon
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Hair styling, beauty treatments
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Beauty & Salon
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Gym Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-gym')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop" 
                    alt="Gym" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Gym
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Fitness center, workout classes
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Fitness
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Car Wash Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-car-wash')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=500&h=300&fit=crop" 
                    alt="Car Wash" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Car Wash
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Vehicle cleaning and detailing
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Car Wash
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Electronics Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-electronics')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=300&fit=crop" 
                    alt="Electronics" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Electronics
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Phones, laptops, accessories
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Electronics
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Stationery Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-stationery')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&h=300&fit=crop" 
                    alt="Stationery" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Stationery
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    School supplies, office items
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Stationery
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Gas Station Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-gas-station')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1545262810-77515befe149?w=500&h=300&fit=crop" 
                    alt="Gas Station" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Gas Station
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    LPG refills, cooking gas delivery
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Gas Station
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Pet Store Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-pet-store')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&h=300&fit=crop" 
                    alt="Pet Store" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Pet Store
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Pet food, toys, grooming supplies
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Pet Store
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Bakery Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-bakery')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop" 
                    alt="Bakery" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Bakery
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Fresh bread, cakes, pastries
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Bakery
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Greengrocery Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-greengrocery')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&h=300&fit=crop" 
                    alt="Greengrocery" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Greengrocery
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Fresh fruits and vegetables
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Greengrocery
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Tailor Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-tailor')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=300&fit=crop" 
                    alt="Tailor" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Tailor
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Clothing alterations, repairs
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Tailor
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Dry Cleaner Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-dry-cleaner')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=500&h=300&fit=crop" 
                    alt="Dry Cleaner" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Dry Cleaner
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Professional garment cleaning
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Dry Cleaning
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Cybercafé Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-cybercafe')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=500&h=300&fit=crop" 
                    alt="Cybercafé" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Cybercafé
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Internet, printing, photocopying
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Cybercafé
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Mobile Money Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-mobile-money')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&h=300&fit=crop" 
                    alt="Mobile Money" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Mobile Money
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    M-Pesa, Airtel Money services
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Mobile Money
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Water Station Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-water-station')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&h=300&fit=crop" 
                    alt="Water Station" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Water Station
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Clean drinking water refills
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Water Station
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Barbershop Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-barbershop')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=300&fit=crop" 
                    alt="Barbershop" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Barbershop
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Men's grooming, haircuts, shaves
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Barbershop
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Spa Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-spa')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=300&fit=crop" 
                    alt="Spa" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Spa
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Massage, facials, wellness
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Spa & Wellness
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Dental Clinic Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-dental-clinic')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&h=300&fit=crop" 
                    alt="Dental Clinic" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Dental Clinic
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Dental care, checkups, emergencies
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Dental Care
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Optical Shop Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-optical-shop')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500&h=300&fit=crop" 
                    alt="Optical Shop" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Optical Shop
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Eyeglasses, contact lenses, exams
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Optical
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Baby Shop Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-baby-shop')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&h=300&fit=crop" 
                    alt="Baby Shop" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Baby Shop
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Diapers, baby food, clothing, toys
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Baby Products
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Boutique Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-boutique')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&h=300&fit=crop" 
                    alt="Boutique" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Boutique
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Fashion, clothing, accessories
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Fashion
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Furniture Store Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-furniture-store')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=300&fit=crop" 
                    alt="Furniture Store" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Furniture Store
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Home furniture, mattresses, decor
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Furniture
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Plumber Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-plumber')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&h=300&fit=crop" 
                    alt="Plumber" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Plumber
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Emergency plumbing, installations
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Plumbing
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Electrician Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-electrician')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&h=300&fit=crop" 
                    alt="Electrician" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Electrician
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Electrical repairs, installations
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Electrical
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Mechanic Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-mechanic')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500&h=300&fit=crop" 
                    alt="Mechanic" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Mechanic
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Car repairs, servicing, diagnostics
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Auto Repair
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Tutor Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-tutor')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&h=300&fit=crop" 
                    alt="Tutor" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Tutor
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Private lessons, homework help
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Education
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Daycare Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-daycare')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=300&fit=crop" 
                    alt="Daycare" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Daycare
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Childcare for working parents
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Daycare
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Caterer Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-caterer')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1555244162-803834f70033?w=500&h=300&fit=crop" 
                    alt="Caterer" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Caterer
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Event catering, party food
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Catering
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Florist Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-florist')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&h=300&fit=crop" 
                    alt="Florist" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Florist
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Fresh flowers, bouquets, events
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Florist
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Courier Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-courier')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=500&h=300&fit=crop" 
                    alt="Courier" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Courier
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Package delivery, document transport
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Courier
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Locksmith Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-locksmith')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&h=300&fit=crop" 
                    alt="Locksmith" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Locksmith
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Key cutting, lock repairs, emergency
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Locksmith
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Pest Control Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-pest-control')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=300&fit=crop" 
                    alt="Pest Control" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Pest Control
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Fumigation, rodent control, bedbugs
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Pest Control
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Cleaning Service Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-cleaning-service')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=500&h=300&fit=crop" 
                    alt="Cleaning Service" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Cleaning Service
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    House cleaning, office cleaning
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Cleaning
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* MtaaLoop Event Planner Card */}
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate('/mtaaloop-event-planner')}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&h=300&fit=crop" 
                    alt="Event Planner" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      🟢 Open
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    MtaaLoop Event Planner
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    Weddings, parties, corporate events
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Event Planning
                    </Badge>
                  </div>
                </div>
              </Card>
                </>
              )}

              {/* Database Vendors - Show when searching or always (filtered) */}
              {searchQuery && filteredVendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => navigate(`/vendor/${vendor.slug}`)}
                >
                  {/* Vendor Image/Banner */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {vendor.cover_image_url || vendor.logo_url ? (
                      <img
                        src={vendor.cover_image_url || vendor.logo_url}
                        alt={vendor.business_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🏪
                      </div>
                    )}
                    
                    {/* Open/Closed Badge */}
                    <div className="absolute top-3 right-3">
                      {vendor.is_open ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          🟢 Open
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          🔴 Closed
                        </Badge>
                      )}
                    </div>

                    {/* Logo Overlay */}
                    {vendor.logo_url && vendor.cover_image_url && (
                      <div className="absolute -bottom-6 left-4">
                        <img
                          src={vendor.logo_url}
                          alt={vendor.business_name}
                          className="w-16 h-16 rounded-xl border-4 border-background object-cover shadow-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Vendor Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                          {vendor.business_name}
                        </h3>
                        {vendor.tagline && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {vendor.tagline}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="font-semibold">
                          {vendor.rating?.toFixed(1) || '4.0'}
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
                            <Clock className="w-4 h-4" />
                            <span>{vendor.delivery_time}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Business Type Badge */}
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

                    {/* Popular indicator if high rating and orders */}
                    {vendor.rating >= 4.5 && vendor.total_orders > 50 && (
                      <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                        <TrendingUp className="w-3 h-3" />
                        <span>Popular in your building</span>
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
            <h2 className="text-2xl font-bold mb-6">Loading vendors...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-40 bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
        </div>
      )}

      {/* Quick Access Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold mb-1">5-15 Min Delivery</h3>
            <p className="text-sm text-muted-foreground">Lightning fast from your building</p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="font-bold mb-1">Building Vendors</h3>
            <p className="text-sm text-muted-foreground">Support your community</p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-3">💚</div>
            <h3 className="font-bold mb-1">Hyperlocal</h3>
            <p className="text-sm text-muted-foreground">Only what's within 500m</p>
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
