import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Filter, Star, Clock, MapPin, Store, Package, TrendingUp, Award, ShoppingBag } from 'lucide-react';
import { 
  calculateDeliveryFee,
  calculateDeliveryTime,
} from '@/lib/vendorUtils';
import { vendors as staticVendors } from '@/data/vendors';

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  description: string;
  operational_category: string;
  logo_url: string | null;
  cover_image_url: string | null;
  tagline: string | null;
  rating: number;
  delivery_time: string | null;
  delivery_fee: number | null;
  is_open: boolean;
  operating_hours?: unknown;
  latitude?: number;
  longitude?: number;
  total_orders?: number;
  total_customers?: number;
  avg_order_value?: number;
  vendor_categories: Array<{
    name: string;
    vendor_subcategories: Array<{
      name: string;
    }>;
  }>;
  vendor_products: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
    image_url: string | null;
  }>;
  reviews?: Array<{ rating: number }>;
}

interface SubcategoryGroup {
  subcategory: string;
  vendors: Vendor[];
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [subcategoryGroups, setSubcategoryGroups] = useState<SubcategoryGroup[]>([]);
  const [vendorsWithoutSub, setVendorsWithoutSub] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Get customer location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Use default location (Nairobi center) if geolocation fails
          setCustomerLocation({ lat: -1.286389, lon: 36.817223 });
        }
      );
    } else {
      // Fallback to Nairobi center
      setCustomerLocation({ lat: -1.286389, lon: 36.817223 });
    }
  }, []);

  // Map URL slugs to actual category names in database
  const slugToCategoryName = (slug: string | undefined): string => {
    if (!slug) return '';
    const mapping: Record<string, string> = {
      'food-drinks': 'Food & Drinks',
      'shopping': 'Shopping',
      'health-wellness': 'Health & Wellness',
      'beauty-spa': 'Beauty & Spa',
      'home-services': 'Home Services',
      'transport-car': 'Transport & Car',
      'living-essentials': 'Living Essentials',
      'special-occasions': 'Special Occasions',
    };
    return mapping[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const categoryName = slugToCategoryName(category);
  const subcategories = SUBCATEGORY_OPTIONS[categoryName || ''] || [];

  const fetchVendors = React.useCallback(async () => {
    try {
      setLoading(true);

      // Filter static vendors by category
      const categoryVendors = staticVendors.filter(vendor => 
        vendor.categories.includes(categoryName)
      );

      if (categoryVendors.length === 0) {
        setVendors([]);
        setSubcategoryGroups([]);
        setVendorsWithoutSub([]);
        return;
      }

      // Transform static vendor data to match expected interface
      const enrichedVendors = categoryVendors.map(vendor => {
        const distance = customerLocation && vendor.distance
          ? parseFloat(vendor.distance.replace(/[^\d.]/g, '')) || 1
          : 1;
        
        const dynamicDeliveryFee = calculateDeliveryFee(distance);
        const dynamicDeliveryTime = calculateDeliveryTime(distance);
        
        return {
          id: vendor.id,
          business_name: vendor.name,
          slug: vendor.slug || vendor.id,
          description: vendor.description,
          operational_category: 'product',
          logo_url: vendor.logo || null,
          cover_image_url: vendor.images[0] || null,
          tagline: vendor.tagline,
          rating: vendor.rating,
          delivery_time: dynamicDeliveryTime,
          delivery_fee: dynamicDeliveryFee,
          is_open: vendor.isOpen ?? true,
          operating_hours: vendor.openHours,
          latitude: -1.286389,
          longitude: 36.817223,
          total_orders: 0,
          total_customers: 0,
          avg_order_value: 0,
          vendor_categories: [{
            name: categoryName,
            vendor_subcategories: []
          }],
          vendor_products: vendor.menu.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            image_url: item.image || null
          })),
          reviews: []
        };
      });

      // All vendors without subcategories (since static data doesn't have subcategory structure)
      setVendors(enrichedVendors);
      setSubcategoryGroups([]);
      setVendorsWithoutSub(enrichedVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryName, customerLocation]);

  useEffect(() => {
    if (categoryName) {
      fetchVendors();
    }
  }, [categoryName, fetchVendors]);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubcategory = selectedSubcategory === 'all' ||
      vendor.vendor_categories.some(cat =>
        cat.vendor_subcategories.some(sub => sub.name === selectedSubcategory)
      );

    return matchesSearch && matchesSubcategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading vendors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {(() => {
          // Category-specific splash images
          const categoryImages: Record<string, string> = {
            'Food & Drinks': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop',
            'Shopping': 'https://images.unsplash.com/photo-1543423924-b9f161af87e4?w=1200&h=600&fit=crop',
            'Health & Wellness': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=600&fit=crop',
            'Beauty & Spa': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop',
            'Home Services': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=600&fit=crop',
            'Transport & Car': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=600&fit=crop',
            'Living Essentials': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=600&fit=crop',
            'Special Occasions': 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&h=600&fit=crop',
          };
          
          const bannerImage = categoryImages[categoryName || ''] || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=600&fit=crop';
          
          return (
            <>
              <img
                src={bannerImage}
                alt={categoryName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            </>
          );
        })()}
        
        {/* Hero Content */}
        <div className="absolute inset-0 container mx-auto px-4 py-8 flex items-center">
          <div className="max-w-3xl text-white">
            <Link to="/" className="inline-flex items-center text-white/90 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">{categoryName}</h1>
            <p className="text-lg md:text-xl drop-shadow-md mb-4">
              Discover {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} ready to serve you
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-sm py-1.5 px-3 bg-white/90 text-foreground">
                ⚡ Fast Delivery
              </Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-3 bg-white/90 text-foreground">
                🏢 In Your Building
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header - Simplified since we have hero banner */}

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {subcategories.length > 0 && (
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="w-full sm:w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Vendors by Subcategories */}
        {subcategoryGroups.length === 0 && vendorsWithoutSub.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-2">
              No vendors found in this category yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon as more vendors join MtaaLoop!
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Vendors grouped by subcategories */}
            {subcategoryGroups.map((group) => (
              <div key={group.subcategory}>
                <h2 className="text-xl font-semibold mb-3">{group.subcategory}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(expandedSubcategories.has(group.subcategory) ? group.vendors : group.vendors.slice(0, 3)).map((vendor) => {
                    const link = `/vendor/${vendor.slug || vendor.id}`;
                    const hasProducts = vendor.vendor_products && vendor.vendor_products.length > 0;
                    const productCount = vendor.vendor_products?.length || 0;
                    
                    return (
                      <Link key={vendor.id} to={link}>
                        <Card className="hover:border-primary transition-all hover:shadow-md cursor-pointer overflow-hidden">
                          {/* Cover Image or Gradient */}
                          {vendor.cover_image_url ? (
                            <div className="h-32 w-full overflow-hidden">
                              <img
                                src={vendor.cover_image_url}
                                alt={vendor.business_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/10" />
                          )}
                          
                          <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              {vendor.logo_url ? (
                                <img
                                  src={vendor.logo_url}
                                  alt={vendor.business_name}
                                  className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm -mt-8"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-white border-2 border-white shadow-sm -mt-8 flex items-center justify-center text-2xl">
                                  <Store className="w-8 h-8 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-bold text-lg">{vendor.business_name}</h3>
                                  {!vendor.is_open && (
                                    <Badge variant="destructive" className="text-xs">
                                      Closed
                                    </Badge>
                                  )}
                                </div>
                                {vendor.tagline && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{vendor.tagline}</p>
                                )}
                              </div>
                            </div>

                            {/* Vendor Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-3 py-2 px-2 bg-muted/30 rounded-lg">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Package className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-semibold">{productCount}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Products</span>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <ShoppingBag className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-semibold">{vendor.total_orders || 0}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Orders</span>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Award className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-semibold">{vendor.total_customers || 0}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Customers</span>
                              </div>
                            </div>

                            {/* Rating and Delivery Info */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                              </div>
                              {vendor.delivery_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{vendor.delivery_time}</span>
                                </div>
                              )}
                              {vendor.delivery_fee !== null && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>KES {vendor.delivery_fee}</span>
                                </div>
                              )}
                            </div>

                            {/* Featured Products */}
                            {hasProducts && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Featured items:</p>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {vendor.vendor_products.slice(0, 3).map((product) => (
                                    <div
                                      key={product.id}
                                      className="flex-shrink-0 w-20 group"
                                    >
                                      {product.image_url ? (
                                        <img
                                          src={product.image_url}
                                          alt={product.name}
                                          className="w-20 h-20 object-cover rounded-md mb-1"
                                        />
                                      ) : (
                                        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center mb-1">
                                          <Package className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                      )}
                                      <p className="text-[10px] font-medium line-clamp-2">{product.name}</p>
                                      <p className="text-[10px] text-primary font-bold">KES {product.price}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* View Store Button */}
                            <Button className="w-full mt-3" size="sm">
                              View Store
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                {group.vendors.length > 3 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setExpandedSubcategories(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(group.subcategory)) {
                            newSet.delete(group.subcategory);
                          } else {
                            newSet.add(group.subcategory);
                          }
                          return newSet;
                        });
                      }}
                    >
                      {expandedSubcategories.has(group.subcategory) 
                        ? `Show less` 
                        : `View all ${group.vendors.length} ${group.subcategory.toLowerCase()} vendors`
                      }
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* Vendors without subcategories */}
            {vendorsWithoutSub.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Other {categoryName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorsWithoutSub.map((vendor) => {
                    const link = `/vendor/${vendor.slug || vendor.id}`;
                    const hasProducts = vendor.vendor_products && vendor.vendor_products.length > 0;
                    const productCount = vendor.vendor_products?.length || 0;
                    
                    return (
                      <Link key={vendor.id} to={link}>
                        <Card className="hover:border-primary transition-all hover:shadow-md cursor-pointer overflow-hidden">
                          {/* Cover Image or Gradient */}
                          {vendor.cover_image_url ? (
                            <div className="h-32 w-full overflow-hidden">
                              <img
                                src={vendor.cover_image_url}
                                alt={vendor.business_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/10" />
                          )}
                          
                          <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              {vendor.logo_url ? (
                                <img
                                  src={vendor.logo_url}
                                  alt={vendor.business_name}
                                  className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm -mt-8"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-white border-2 border-white shadow-sm -mt-8 flex items-center justify-center text-2xl">
                                  <Store className="w-8 h-8 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-bold text-lg">{vendor.business_name}</h3>
                                  {!vendor.is_open && (
                                    <Badge variant="destructive" className="text-xs">
                                      Closed
                                    </Badge>
                                  )}
                                </div>
                                {vendor.tagline && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{vendor.tagline}</p>
                                )}
                              </div>
                            </div>

                            {/* Vendor Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-3 py-2 px-2 bg-muted/30 rounded-lg">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Package className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-semibold">{productCount}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Products</span>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <ShoppingBag className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-semibold">{vendor.total_orders || 0}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Orders</span>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Award className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-semibold">{vendor.total_customers || 0}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Customers</span>
                              </div>
                            </div>

                            {/* Rating and Delivery Info */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                              </div>
                              {vendor.delivery_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{vendor.delivery_time}</span>
                                </div>
                              )}
                              {vendor.delivery_fee !== null && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>KES {vendor.delivery_fee}</span>
                                </div>
                              )}
                            </div>

                            {/* Featured Products */}
                            {hasProducts && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Featured items:</p>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {vendor.vendor_products.slice(0, 3).map((product) => (
                                    <div
                                      key={product.id}
                                      className="flex-shrink-0 w-20 group"
                                    >
                                      {product.image_url ? (
                                        <img
                                          src={product.image_url}
                                          alt={product.name}
                                          className="w-20 h-20 object-cover rounded-md mb-1"
                                        />
                                      ) : (
                                        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center mb-1">
                                          <Package className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                      )}
                                      <p className="text-[10px] font-medium line-clamp-2">{product.name}</p>
                                      <p className="text-[10px] text-primary font-bold">KES {product.price}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* View Store Button */}
                            <Button className="w-full mt-3" size="sm">
                              View Store
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
