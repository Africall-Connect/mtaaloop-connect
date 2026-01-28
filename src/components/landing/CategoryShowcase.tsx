import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { VendorCategory, VendorSubcategory } from "@/types/database";

export const CategoryShowcase = () => {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [subcategories, setSubcategories] = useState<VendorSubcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesAndSubcategories();
  }, []);

  const fetchCategoriesAndSubcategories = async () => {
    try {
      setLoading(true);
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('vendor_subcategories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (subcategoriesError) throw subcategoriesError;

      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error("Error fetching categories for showcase:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageForCategory = (categoryName: string) => {
    const imageMap: Record<string, string> = {
      "Food & Drinks": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=32&h=32&fit=crop",
      "Groceries & Essentials": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=32&h=32&fit=crop",
      "Health & Wellness": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=32&h=32&fit=crop",
      "Beauty & Spa": "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=32&h=32&fit=crop",
      "Auto Services": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=32&h=32&fit=crop",
      "Liquor Store": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=32&h=32&fit=crop",
      "Home Services": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=32&h=32&fit=crop",
      "Repairs & Maintenance": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=32&h=32&fit=crop",
      "Fashion & Clothing": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=32&h=32&fit=crop",
      "Electronics & Gadgets": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=32&h=32&fit=crop",
      "Fitness & Sports": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=32&h=32&fit=crop",
      "Education & Tutoring": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=32&h=32&fit=crop",
      "Events & Entertainment": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=32&h=32&fit=crop",
      "Professional Services": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=32&h=32&fit=crop",
      "Pet Services": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=32&h=32&fit=crop",
      "Home & Garden": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=32&h=32&fit=crop",
      "Books & Stationery": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=32&h=32&fit=crop",
      "Baby & Kids": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=32&h=32&fit=crop",
      "Transport & Logistics": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=32&h=32&fit=crop",
      "Accommodation": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=32&h=32&fit=crop",
      "Flowers & Gifts": "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=32&h=32&fit=crop",
      "Utilities & Services": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=32&h=32&fit=crop",
      "Security Services": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=32&h=32&fit=crop",
      "Religious Services": "https://images.unsplash.com/photo-1507692049790-de58290a4354?w=32&h=32&fit=crop",
      "Creative Services": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=32&h=32&fit=crop",
      "Construction Services": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=32&h=32&fit=crop",
      "Agriculture & Farming": "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=32&h=32&fit=crop",
      "Waste & Recycling": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=32&h=32&fit=crop",
      "Wedding Services": "https://images.unsplash.com/photo-1519741497674-611481863552?w=32&h=32&fit=crop",
      "Special Occasions": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=32&h=32&fit=crop",
    };
    return imageMap[categoryName] || "https://via.placeholder.com/32x32?text=Category";
  };

  const getExamplesForCategory = (categoryId: string) => {
    const categorySubs = subcategories.filter(sub => sub.category_id === categoryId);
    if (categorySubs.length >= 3) {
      return categorySubs.slice(0, 3).map(sub => sub.name).join(", ");
    } else if (categorySubs.length > 0) {
      return categorySubs.map(sub => sub.name).join(", ");
    }
    return "Various services";
  };

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Everything You Need in Your Building's Marketplace
        </h2>
        <p className="text-xl text-muted-foreground text-center mb-16">
          From vendors inside your apartment to nearby businesses serving your community
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.slice(0, 9).map((category, index) => (
            <Link key={category.id} to={`/categories/${category.slug}`}>
              <Card
                className={`
                  group relative overflow-hidden cursor-pointer 
                  border-2 border-border hover:border-primary/50
                  transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                  ${index < 2 ? "md:col-span-2 lg:col-span-1" : ""}
                `}
                style={{
                  animation: `slide-up 0.5s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${[
                  "from-orange-500/20 to-red-500/20",
                  "from-blue-500/20 to-cyan-500/20",
                  "from-green-500/20 to-emerald-500/20",
                  "from-pink-500/20 to-purple-500/20",
                  "from-slate-500/20 to-gray-500/20",
                  "from-amber-500/20 to-yellow-500/20",
                  "from-teal-500/20 to-green-500/20",
                  "from-red-500/20 to-pink-500/20",
                  "from-indigo-500/20 to-blue-500/20",
                ][index % 9]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <img src={getImageForCategory(category.name)} alt={category.name} className="w-8 h-8 object-cover" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{Math.floor(Math.random() * 50) + 10}</div>
                      <div className="text-xs text-muted-foreground">vendors</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{getExamplesForCategory(category.id)}</p>
                  </div>

                  <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore →
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="text-primary font-semibold text-lg hover:underline">
            See All {categories.length}+ Categories →
          </button>
        </div>
      </div>
    </section>
  );
};
