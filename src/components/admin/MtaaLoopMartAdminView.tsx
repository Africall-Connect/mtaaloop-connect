import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EditProductDialog from "./EditProductDialog";

interface SupermarketItem {
  id: string;
  product_name: string;
  markup_price: number;
  image_url: string;
  category: string;
  in_stock: boolean;
}

const MtaaLoopMartAdminView = () => {
  const [items, setItems] = useState<SupermarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<SupermarketItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("big_supermarket_items")
        .select("id, product_name, markup_price, image_url, category, in_stock")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setItems(data || []);
      const uniqueCategories = [...new Set(data?.map((item) => item.category).filter(Boolean) as string[])];
      setCategories(uniqueCategories);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: SupermarketItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSaveItem = (updatedItem: SupermarketItem) => {
    setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const filteredItems = items
    .filter((item) => !selectedCategory || item.category === selectedCategory)
    .filter((item) =>
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <header className="mb-8 text-center px-2 sm:px-4">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 drop-shadow-lg">MtaaLoop Mart Management</h1>
          <p className="text-base sm:text-xl text-blue-100 max-w-full sm:max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
            Manage your product inventory with ease. Click on any product card to edit its details, pricing, and availability.
          </p>
        </div>
      </header>

      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <Input
          type="text"
          placeholder="Search for products..."
          className="flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-slate-600 dark:text-slate-300">Loading products...</span>
        </div>
      )}
      {error && (
        <div className="text-center py-16">
          <div className="text-red-500 text-lg font-semibold mb-2">Error loading products</div>
          <p className="text-slate-600 dark:text-slate-300">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map((item, index) => (
            <Card
              key={item.id}
              className="group overflow-hidden cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleItemClick(item)}
            >
              <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x300/6B46C1/FFFFFF?text=' + encodeURIComponent(item.product_name)}
                />
                {!item.in_stock && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
                    <Badge variant="destructive" className="text-lg px-3 py-1 font-semibold shadow-lg">
                      Out of Stock
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="secondary"
                    className="bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 backdrop-blur-sm"
                  >
                    {item.category}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg truncate text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.product_name}
                </h3>
                <p className="text-green-600 dark:text-green-400 font-bold text-xl mt-2">
                  KSh {item.markup_price.toFixed(2)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge
                    variant={item.in_stock ? "default" : "destructive"}
                    className={`text-xs ${item.in_stock ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}`}
                  >
                    {item.in_stock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                  <div className="text-xs text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to edit
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedItem && (
        <EditProductDialog
          item={selectedItem}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
};

export default MtaaLoopMartAdminView;
