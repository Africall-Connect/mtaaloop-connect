import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MTAALOOP_MART_VENDOR_ID, MTAALOOP_MART_VENDOR_NAME } from "@/constants/mtaaloopMart";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { Skeleton } from "@/components/ui/skeleton";

interface SupermarketItem {
  id: string;
  product_name: string;
  markup_price: number | null;
  image_url: string | null;
  category: string | null;
  price: number | null;
  clean_name: string | null;
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop";

const getProductImage = (item: SupermarketItem): string => {
  const url = item.image_url;
  if (!url || url.includes('via.placeholder.com')) {
    // Generate a deterministic Unsplash image based on product name
    const query = encodeURIComponent(item.clean_name || item.product_name || 'grocery');
    return `https://source.unsplash.com/300x300/?${query},food`;
  }
  return url;
};

const MtaaLoopMart = () => {
  const { addItem } = useCart();
  const [items, setItems] = useState<SupermarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        // Fetch in batches to bypass 1000-row limit
        let allData: SupermarketItem[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("big_supermarket_items")
            .select("id, product_name, markup_price, image_url, category, price, clean_name")
            .order("category", { ascending: true })
            .range(from, from + batchSize - 1);

          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += batchSize;
            if (data.length < batchSize) hasMore = false;
          } else {
            hasMore = false;
          }
        }

        setItems(allData);
        const uniqueCategories = [...new Set(allData.map((item) => item.category).filter(Boolean) as string[])].sort();
        setCategories(uniqueCategories);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = items
    .filter((item) => selectedCategory === "All" || item.category === selectedCategory)
    .filter((item) => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddToCart = (item: SupermarketItem) => {
    addItem({
      id: item.id,
      name: item.product_name,
      price: item.markup_price ?? item.price ?? 0,
      quantity: 1,
      image: item.image_url || PLACEHOLDER_IMG,
      vendorId: MTAALOOP_MART_VENDOR_ID,
      vendorName: MTAALOOP_MART_VENDOR_NAME,
    });
    toast.success(`${item.product_name} added to cart`);
  };

  return (
    <div className="bg-muted/30 min-h-screen">
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
              </Button>
            </Link>
          </div>
        </header>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("All")}
              className="shrink-0"
            >
              All ({items.length})
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="shrink-0"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-6 w-1/2" /></CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-12">{error}</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden flex flex-col">
                <div className="relative h-48 bg-white p-4">
                  <img
                    src={item.image_url || PLACEHOLDER_IMG}
                    alt={item.product_name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                  />
                  {item.category && (
                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3 flex-grow">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.product_name}</h3>
                  <p className="text-primary font-bold text-lg">
                    KSh {(item.markup_price ?? item.price ?? 0).toFixed(0)}
                  </p>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button className="w-full" size="sm" onClick={() => handleAddToCart(item)}>
                    <ShoppingBag className="w-4 h-4 mr-1" /> Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <FloatingCartButton />
    </div>
  );
};

export default MtaaLoopMart;
