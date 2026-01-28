import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Zap, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { Skeleton } from "@/components/ui/skeleton";

interface SupermarketItem {
  id: string;
  product_name: string;
  markup_price: number;
  image_url: string;
  category: string;
  price: number;
  clean_name: string;
}

const MtaaLoopMart = () => {
  const { addItem } = useCart();
  const [items, setItems] = useState<SupermarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("big_supermarket_items")
          .select("id, product_name, markup_price, image_url, category, price, clean_name")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setItems(data || []);
        const uniqueCategories = [...new Set(data?.map((item) => item.category).filter(Boolean) as string[])];
        setCategories(['All', ...uniqueCategories]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = items
    .filter((item) => !selectedCategory || selectedCategory === 'All' || item.category === selectedCategory)
    .filter((item) =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleAddToCart = (item: SupermarketItem) => {
    addItem({
      id: item.id,
      name: item.product_name,
      price: item.markup_price,
      quantity: 1,
      image: item.image_url,
      vendorId: 'MtaaLoopMart',
      vendorName: 'MtaaLoopMart',
    });
    toast.success("Added to cart", {
      description: `${item.product_name} has been added to your cart.`,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="relative bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg p-8 md:p-12 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/home">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome to MtaaLoop Mart</h1>
                <p className="text-lg md:text-xl text-purple-200">Fast delivery of your favorite essentials, right to your doorstep.</p>
              </div>
            </div>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20 hover:text-white">
                <ShoppingBag className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Filters</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-8 w-1/2" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="group overflow-hidden flex flex-col">
                    <div className="relative h-48 bg-white p-4">
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => e.currentTarget.src = `https://via.placeholder.com/300x300/6B46C1/FFFFFF?text=${encodeURIComponent(item.product_name)}`}
                      />
                      <Badge variant="secondary" className="absolute top-2 right-2">{item.category}</Badge>
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <h3 className="font-semibold text-lg truncate mb-2">{item.product_name}</h3>
                      <p className="text-primary font-bold text-2xl">
                        KSh {item.markup_price.toFixed(2)}
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

export default MtaaLoopMart;
