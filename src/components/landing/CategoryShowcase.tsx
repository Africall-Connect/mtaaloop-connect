import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { VendorCategory, VendorSubcategory } from "@/types/database";
import { motion } from "framer-motion";

const waveIn = (fromRight: boolean, delay: number) => ({
  initial: { x: fromRight ? 120 : -120, opacity: 0 },
  whileInView: { x: 0, opacity: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 45, damping: 13, delay },
    opacity: { duration: 0.5, delay },
  },
});

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
        .from('vendor_categories').select('*').eq('is_active', true).order('display_order', { ascending: true });
      if (categoriesError) throw categoriesError;
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('vendor_subcategories').select('*').eq('is_active', true).order('display_order', { ascending: true });
      if (subcategoriesError) throw subcategoriesError;
      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      "Home Services": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=32&h=32&fit=crop",
      "Repairs & Maintenance": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=32&h=32&fit=crop",
    };
    return imageMap[categoryName] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=32&h=32&fit=crop";
  };

  const getExamplesForCategory = (categoryId: string) => {
    const categorySubs = subcategories.filter(sub => sub.category_id === categoryId);
    if (categorySubs.length >= 3) return categorySubs.slice(0, 3).map(sub => sub.name).join(", ");
    if (categorySubs.length > 0) return categorySubs.map(sub => sub.name).join(", ");
    return "Various services";
  };

  if (loading) {
    return (
      <section className="h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-gray-400 text-lg">Loading categories...</div>
      </section>
    );
  }

  const gradients = [
    "from-orange-400 to-rose-400", "from-blue-400 to-indigo-400",
    "from-emerald-400 to-teal-400", "from-pink-400 to-purple-400",
    "from-amber-400 to-yellow-400", "from-cyan-400 to-blue-400",
  ];

  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
      <div className="container px-4">
        <motion.div {...waveIn(false, 0)} className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-bold mb-4">Categories</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Everything. Under One Roof.
          </h2>
          <p className="text-lg text-gray-500 mt-3">From the vendor next door to experts across the hall</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {categories.slice(0, 6).map((category, index) => (
            <motion.div key={category.id} {...waveIn(index % 2 === 1, 0.1 + index * 0.1)}>
              <Link to={`/categories/${category.slug}`}>
                <Card className="group relative overflow-hidden cursor-pointer border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl bg-white/70 backdrop-blur-sm">
                  <div className="relative p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[index % 6]} shadow-lg`}>
                        <img src={getImageForCategory(category.name)} alt={category.name} className="w-6 h-6 object-cover rounded" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">{category.name}</h3>
                      <p className="text-xs text-gray-500">{getExamplesForCategory(category.id)}</p>
                    </div>
                    <div className="flex items-center text-xs font-bold text-gray-400 group-hover:text-gray-700 transition-colors">
                      Explore →
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div {...waveIn(true, 0.7)} className="text-center mt-8">
          <button className="text-primary font-bold text-sm hover:underline">
            See All {categories.length}+ Categories →
          </button>
        </motion.div>
      </div>
    </section>
  );
};
