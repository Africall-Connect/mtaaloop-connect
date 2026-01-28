import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VendorCategory, VendorSubcategory } from "@/types/database";
import { getVendorsByCategory } from "@/data/vendors"; // Assuming this function can fetch by subcategory slug

const FoodDrinks = () => {
  const [foodDrinksCategory, setFoodDrinksCategory] = useState<VendorCategory | null>(null);
  const [subcategories, setSubcategories] = useState<VendorSubcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoodDrinksData();
  }, []);

  const fetchFoodDrinksData = async () => {
    try {
      setLoading(true);
      // Fetch the "Food & Drinks" main category
      const { data: categoryData, error: categoryError } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('name', 'Food & Drinks')
        .single();

      if (categoryError) throw categoryError;
      setFoodDrinksCategory(categoryData);

      if (categoryData) {
        // Fetch subcategories for "Food & Drinks"
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('vendor_subcategories')
          .select('*')
          .eq('category_id', categoryData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (subcategoriesError) throw subcategoriesError;
        setSubcategories(subcategoriesData || []);
      }
    } catch (error) {
      console.error("Error fetching Food & Drinks data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!foodDrinksCategory) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Food & Drinks category not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🍽️ {foodDrinksCategory.name}</h1>
            <p className="text-muted-foreground">{foodDrinksCategory.description || "Explore a variety of food and drink options."}</p>
          </div>
        </div>

        <div className="space-y-6">
          {subcategories.map((subCategory) => {
            const vendors = getVendorsByCategory(subCategory.name); // Assuming this fetches by subcategory name
            return (
              <div key={subCategory.id}>
                <h2 className="text-xl font-semibold mb-3">{subCategory.name}</h2>
                <div className="space-y-3">
                  {vendors.slice(0, 3).map((vendor) => (
                    <Link key={vendor.id} to={`/vendor/${vendor.slug}`}>
                      <Card className="p-4 hover:border-primary transition-all hover:shadow-md cursor-pointer">
                        <div className="flex items-start gap-3">
                          <img
                            src={vendor.logo || vendor.images[0]}
                            alt={vendor.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{vendor.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{vendor.tagline}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>⭐ {vendor.rating}</span>
                              <span>📍 {vendor.distance}</span>
                              <span>🚚 {vendor.deliveryTime}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                  {vendors.length > 3 && (
                    <div className="text-center">
                      <Link to={`/subcategory/${subCategory.slug}`}>
                        <Button variant="outline" size="sm">
                          View all {vendors.length} {subCategory.name.toLowerCase()}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {subcategories.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No subcategories found for Food & Drinks.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodDrinks;
