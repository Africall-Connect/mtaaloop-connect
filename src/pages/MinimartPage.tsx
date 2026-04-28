import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, VendorProfile } from "@/types/database";

const MinimartPage = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { addItem } = useCart();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchVendorAndProducts = async () => {
      if (!vendorId) return;
      try {
        setLoading(true);
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (vendorError) throw vendorError;
        setVendor(vendorData);

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', vendorId);

        if (productError) throw productError;
        setItems(productData || []);

        const uniqueSubcategories = [...new Set(productData?.map((item) => item.subcategory).filter(Boolean) as string[])];
        setSubcategories(['All', ...uniqueSubcategories]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorAndProducts();
  }, [vendorId]);

  const filteredItems = items
    .filter((item) => !selectedSubcategory || selectedSubcategory === 'All' || item.subcategory === selectedSubcategory)
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleAddToCart = (item: Product) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image_url,
      vendorId: vendor?.id || '',
      vendorName: vendor?.business_name || '',
      category: item.category,
    });
    toast.success("Added to cart", {
      description: `${item.name} has been added to your cart.`,
    });
  };

  return (
    <div className="bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="relative text-center py-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-gray-800 hover:bg-white/20 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="block text-gray-900">{vendor?.business_name}</span>
              <span className="block mt-2 text-gradient">Your Neighborhood Minimart.</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Browse through a wide selection of products from your favorite local store, delivered in minutes.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="font-semibold mb-4 text-2xl text-gray-800">Filters</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-12 py-3 w-full rounded-full border-2 border-gray-300 focus:border-primary transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-xl text-gray-800">Subcategories</h4>
              <div className="flex flex-col space-y-2">
                {subcategories.map((subcategory) => (
                  <Button
                    key={subcategory}
                    variant={selectedSubcategory === subcategory ? "default" : "ghost"}
                    size="lg"
                    onClick={() => setSelectedSubcategory(subcategory)}
                    className={`justify-start w-full text-left rounded-lg ${selectedSubcategory === subcategory ? 'bg-primary/90 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    {subcategory}
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="rounded-lg shadow-lg">
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-8 w-1/2" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full rounded-b-lg" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="group overflow-hidden flex flex-col rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                    <div className="relative h-48 bg-white p-4">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop'}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop'}
                      />
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <h3 className="font-semibold text-lg truncate mb-2">{item.name}</h3>
                      <p className="text-primary font-bold text-2xl">
                        KSh {item.price.toFixed(2)}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => handleAddToCart(item)}>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
      <FloatingCartButton />
    </div>
  );
};

export default MinimartPage;
