import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Clock, MapPin } from "lucide-react";

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  cover_image_url: string | null;
  tagline: string | null;
  rating: number;
  delivery_time: string | null;
  delivery_fee: number | null;
  is_open: boolean;
}

interface SubcategoryGroup {
  subcategory: string;
  vendors: Vendor[];
}

const FoodDrinks2 = () => {
  const [loading, setLoading] = useState(true);
  const [subcategoryGroups, setSubcategoryGroups] = useState<SubcategoryGroup[]>([]);
  const [vendorsWithoutSub, setVendorsWithoutSub] = useState<Vendor[]>([]);

  useEffect(() => {
    fetchFoodDrinksVendors();
  }, []);

  const fetchFoodDrinksVendors = async () => {
    try {
      setLoading(true);

      // 1. Find all vendor_categories with name "Food & Drinks"
      const { data: categories, error: catError } = await supabase
        .from('vendor_categories')
        .select('id, vendor_id')
        .eq('name', 'Food & Drinks')
        .eq('is_active', true);

      if (catError) throw catError;

      if (!categories || categories.length === 0) {
        setLoading(false);
        return;
      }

      const categoryIds = categories.map(c => c.id);
      const vendorIds = categories.map(c => c.vendor_id);

      // 2. Fetch vendor_profiles for these vendors
      const { data: vendors, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, slug, logo_url, cover_image_url, tagline, rating, delivery_time, delivery_fee, is_open')
        .in('id', vendorIds)
        .eq('is_approved', true)
        .eq('is_active', true);

      if (vendorError) throw vendorError;

      // 3. Fetch subcategories for these categories
      const { data: subcategories, error: subError } = await supabase
        .from('vendor_subcategories')
        .select('id, name, vendor_id, category_id')
        .in('category_id', categoryIds)
        .eq('is_active', true);

      if (subError) throw subError;

      // 4. Group vendors by subcategory
      const subGroups: { [key: string]: Vendor[] } = {};
      const vendorsWithSub = new Set<string>();

      if (subcategories && subcategories.length > 0) {
        subcategories.forEach(sub => {
          const vendor = vendors?.find(v => v.id === sub.vendor_id);
          if (vendor) {
            if (!subGroups[sub.name]) {
              subGroups[sub.name] = [];
            }
            subGroups[sub.name].push(vendor);
            vendorsWithSub.add(vendor.id);
          }
        });
      }

      // 5. Vendors without subcategories
      const withoutSub = vendors?.filter(v => !vendorsWithSub.has(v.id)) || [];

      // Convert to array format
      const groupsArray = Object.entries(subGroups).map(([subcategory, vendors]) => ({
        subcategory,
        vendors,
      }));

      console.log('📋 FoodDrinks2 - Fetched vendors:', {
        totalVendors: vendors?.length || 0,
        withSubcategories: Object.keys(subGroups).length,
        withoutSubcategories: withoutSub.length,
        subcategoryGroups: groupsArray.map(g => ({
          name: g.subcategory,
          vendorCount: g.vendors.length,
          vendors: g.vendors.map(v => ({
            id: v.id,
            name: v.business_name,
            slug: v.slug || 'NO_SLUG'
          }))
        }))
      });

      setSubcategoryGroups(groupsArray);
      setVendorsWithoutSub(withoutSub);
    } catch (error) {
      console.error('Error fetching Food & Drinks vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasVendors = subcategoryGroups.length > 0 || vendorsWithoutSub.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🍽️ Food & Drinks</h1>
            <p className="text-muted-foreground">
              {hasVendors
                ? "Everything from traditional to fast food"
                : "No vendors available yet"}
            </p>
          </div>
        </div>

        {!hasVendors ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-2">
              No Food & Drinks vendors found in your area yet.
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
                <div className="space-y-3">
                  {group.vendors.slice(0, 3).map((vendor) => {
                    const link = `/vendor/${vendor.slug || vendor.id}`;
                    console.log('🔗 Creating vendor link:', {
                      businessName: vendor.business_name,
                      slug: vendor.slug,
                      id: vendor.id,
                      finalLink: link
                    });
                    return (
                    <Link key={vendor.id} to={link}>
                      <Card className="p-4 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                        <div className="flex items-start gap-3">
                          {vendor.logo_url || vendor.cover_image_url ? (
                            <img
                              src={vendor.logo_url || vendor.cover_image_url || ''}
                              alt={vendor.business_name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                              🍽️
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{vendor.business_name}</h3>
                              {!vendor.is_open && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                  Closed
                                </span>
                              )}
                            </div>
                            {vendor.tagline && (
                              <p className="text-sm text-muted-foreground mb-1">{vendor.tagline}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{vendor.rating.toFixed(1)}</span>
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
                                  <span>KES {vendor.delivery_fee} fee</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                    );
                  })}
                  {group.vendors.length > 3 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View all {group.vendors.length} {group.subcategory.toLowerCase()} vendors
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Vendors without subcategories */}
            {vendorsWithoutSub.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Other Food & Drinks</h2>
                <div className="space-y-3">
                  {vendorsWithoutSub.map((vendor) => (
                    <Link key={vendor.id} to={`/vendor/${vendor.slug || vendor.id}`}>
                      <Card className="p-4 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                        <div className="flex items-start gap-3">
                          {vendor.logo_url || vendor.cover_image_url ? (
                            <img
                              src={vendor.logo_url || vendor.cover_image_url || ''}
                              alt={vendor.business_name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                              🍽️
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{vendor.business_name}</h3>
                              {!vendor.is_open && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                  Closed
                                </span>
                              )}
                            </div>
                            {vendor.tagline && (
                              <p className="text-sm text-muted-foreground mb-1">{vendor.tagline}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{vendor.rating.toFixed(1)}</span>
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
                                  <span>KES {vendor.delivery_fee} fee</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDrinks2;
