import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, Clock, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

const Logistics2 = () => {
  const [loading, setLoading] = useState(true);
  const [subcategoryGroups, setSubcategoryGroups] = useState<SubcategoryGroup[]>([]);
  const [vendorsWithoutSub, setVendorsWithoutSub] = useState<Vendor[]>([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);

      const { data: categories, error: catError } = await supabase
        .from('vendor_categories')
        .select('id, vendor_id')
        .eq('name', 'Transport & Logistics')
        .eq('is_active', true);

      if (catError) throw catError;

      if (!categories || categories.length === 0) {
        setLoading(false);
        return;
      }

      const categoryIds = categories.map(c => c.id);
      const vendorIds = categories.map(c => c.vendor_id);

      const { data: vendors, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, slug, logo_url, cover_image_url, tagline, rating, delivery_time, delivery_fee, is_open')
        .in('id', vendorIds)
        .eq('is_approved', true)
        .eq('is_active', true);

      if (vendorError) throw vendorError;

      const { data: subcategories, error: subError } = await supabase
        .from('vendor_subcategories')
        .select('id, name, vendor_id, category_id')
        .in('category_id', categoryIds)
        .eq('is_active', true);

      if (subError) throw subError;

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

      const withoutSub = vendors?.filter(v => !vendorsWithSub.has(v.id)) || [];
      const groupsArray = Object.entries(subGroups).map(([subcategory, vendors]) => ({
        subcategory,
        vendors,
      }));

      setSubcategoryGroups(groupsArray);
      setVendorsWithoutSub(withoutSub);
    } catch (error) {
      console.error('Error fetching Transport & Logistics vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVendorCard = (vendor: Vendor) => (
    <Link key={vendor.id} to={`/vendor/${vendor.slug}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200">
        <div className="relative h-40">
          {vendor.cover_image_url ? (
            <img src={vendor.cover_image_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              <Truck className="w-16 h-16 text-orange-600" />
            </div>
          )}
          {!vendor.is_open && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold bg-red-600 px-4 py-2 rounded">Closed</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3 mb-2">
            {vendor.logo_url && (
              <img src={vendor.logo_url} alt={`${vendor.business_name} logo`} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg line-clamp-1">{vendor.business_name}</h3>
              {vendor.tagline && <p className="text-sm text-muted-foreground line-clamp-1">{vendor.tagline}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
            {vendor.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                <span className="font-medium">{vendor.rating.toFixed(1)}</span>
              </div>
            )}
            {vendor.delivery_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{vendor.delivery_time}</span>
              </div>
            )}
            {vendor.delivery_fee !== null && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>KSh {vendor.delivery_fee}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/home">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transport & Logistics</h1>
              <p className="text-muted-foreground">Moving, Delivery & Transport</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {subcategoryGroups.length === 0 && vendorsWithoutSub.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Vendors Available</h2>
                <p className="text-muted-foreground">Check back soon for Transport & Logistics vendors in your area.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {subcategoryGroups.map((group) => (
                  <div key={group.subcategory}>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">{group.subcategory}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.vendors.map(renderVendorCard)}
                    </div>
                  </div>
                ))}
                {vendorsWithoutSub.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">
                      {subcategoryGroups.length > 0 ? 'Other Transport & Logistics Vendors' : 'All Transport & Logistics Vendors'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vendorsWithoutSub.map(renderVendorCard)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Logistics2;
