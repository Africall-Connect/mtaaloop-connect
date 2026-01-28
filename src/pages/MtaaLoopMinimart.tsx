import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Star,
  Truck,
  Clock,
  Package,
  Apple,
  Milk,
  Cookie,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const mockProducts = [
  {
    id: 1,
    name: "Unga Maize Flour 2kg",
    description: "Premium maize flour for ugali",
    price: 180,
    category: "Grains & Flour",
    brand: "Unga",
    size: "2kg",
    stock: 50,
    image: "🌾",
    rating: 4.7,
    reviews: 234
  },
  {
    id: 2,
    name: "Brookside Fresh Milk 500ml",
    description: "Fresh pasteurized milk",
    price: 65,
    category: "Dairy",
    brand: "Brookside",
    size: "500ml",
    stock: 100,
    image: "🥛",
    rating: 4.5,
    reviews: 189
  },
  {
    id: 3,
    name: "Kimbo Cooking Fat 1kg",
    description: "Premium cooking fat",
    price: 350,
    category: "Cooking Essentials",
    brand: "Kimbo",
    size: "1kg",
    stock: 35,
    image: "🧈",
    rating: 4.6,
    reviews: 156
  },
  {
    id: 4,
    name: "Royco Mchuzi Mix",
    description: "All-purpose seasoning",
    price: 25,
    category: "Spices & Seasonings",
    brand: "Royco",
    size: "10g",
    stock: 200,
    image: "🧂",
    rating: 4.8,
    reviews: 312
  },
  {
    id: 5,
    name: "Ketepa Pride Tea Bags",
    description: "Premium Kenyan tea, 50 bags",
    price: 180,
    category: "Beverages",
    brand: "Ketepa",
    size: "50 bags",
    stock: 45,
    image: "🍵",
    rating: 4.7,
    reviews: 178
  },
  {
    id: 6,
    name: "Omo Washing Powder 1kg",
    description: "Powerful stain removal",
    price: 280,
    category: "Household",
    brand: "Omo",
    size: "1kg",
    stock: 60,
    image: "🧼",
    rating: 4.4,
    reviews: 145
  },
  {
    id: 7,
    name: "Golden Fry Cooking Oil 1L",
    description: "Pure vegetable cooking oil",
    price: 320,
    category: "Cooking Essentials",
    brand: "Golden Fry",
    size: "1L",
    stock: 40,
    image: "🫒",
    rating: 4.5,
    reviews: 198
  },
  {
    id: 8,
    name: "Indomie Instant Noodles",
    description: "Quick and tasty noodles",
    price: 50,
    category: "Snacks",
    brand: "Indomie",
    size: "70g",
    stock: 150,
    image: "🍜",
    rating: 4.3,
    reviews: 267
  },
  {
    id: 9,
    name: "Blue Band Margarine 500g",
    description: "Nutritious bread spread",
    price: 220,
    category: "Dairy",
    brand: "Blue Band",
    size: "500g",
    stock: 55,
    image: "🧈",
    rating: 4.6,
    reviews: 134
  },
  {
    id: 10,
    name: "Sunlight Dish Soap 750ml",
    description: "Tough on grease, gentle on hands",
    price: 180,
    category: "Household",
    brand: "Sunlight",
    size: "750ml",
    stock: 70,
    image: "🧴",
    rating: 4.4,
    reviews: 112
  },
  {
    id: 11,
    name: "Soko Ugali Flour 2kg",
    description: "Quality maize flour",
    price: 165,
    category: "Grains & Flour",
    brand: "Soko",
    size: "2kg",
    stock: 45,
    image: "🌾",
    rating: 4.3,
    reviews: 89
  },
  {
    id: 12,
    name: "White Sugar 1kg",
    description: "Pure white sugar",
    price: 160,
    category: "Cooking Essentials",
    brand: "Mumias",
    size: "1kg",
    stock: 80,
    image: "🍬",
    rating: 4.5,
    reviews: 167
  }
];

const MtaaLoopMinimart = () => {
  const [products] = useState(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<Array<{ id: string | number; name: string; base_price: number; quantity: number; stock_quantity?: number; price?: number; image?: string; brand?: string; size?: string; stock?: number }>>([]);

  const categories = ["All", "Grains & Flour", "Dairy", "Cooking Essentials", "Spices & Seasonings", "Beverages", "Household", "Snacks"];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: { id: string | number; name: string; base_price: number; stock_quantity?: number }) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string | number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalItems = () => cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cartItems.reduce((sum, item) => sum + (Number(item.price || item.base_price) * item.quantity), 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Dairy": return <Milk className="w-5 h-5" />;
      case "Snacks": return <Cookie className="w-5 h-5" />;
      case "Grains & Flour": return <Apple className="w-5 h-5" />;
      case "Household": return <Sparkles className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/compliance">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">MtaaLoop Minimart</h1>
                <p className="text-green-100">Groceries, snacks & household essentials</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">KSh {getTotalPrice().toLocaleString()}</div>
                <div className="text-sm text-green-100">Cart Total</div>
              </div>
              <Button className="bg-white text-green-600 hover:bg-green-50 relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({getTotalItems()})
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="cart">Cart ({getTotalItems()})</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Info</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const cartItem = cartItems.find(item => item.id === product.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-4xl">{product.image}</div>
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.brand} • {product.size}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{product.rating}</span>
                          <span className="text-muted-foreground">({product.reviews})</span>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <div>Stock: {product.stock} available</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-green-600">
                            KSh {product.price.toLocaleString()}
                          </span>
                        </div>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-medium min-w-8 text-center">{quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stock}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => addToCart({ ...product, base_price: product.price, stock_quantity: product.stock })}
                            disabled={product.stock === 0}
                          >
                            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Cart Tab */}
          <TabsContent value="cart" className="space-y-6">
            <h2 className="text-2xl font-bold">Your Cart</h2>

            {cartItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600">Add some items to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="text-3xl">{item.image}</div>
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.brand} • {item.size}</p>
                            <p className="text-sm font-medium">KSh {item.price.toLocaleString()} each</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-medium min-w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= Number(item.stock || item.stock_quantity || 0)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="font-bold">KSh {(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>KSh {getTotalPrice().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>KSh 100</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-3">
                        <span>Total</span>
                        <span>KSh {(getTotalPrice() + 100).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" size="lg">
                      Proceed to Checkout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Delivery Info Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <h2 className="text-2xl font-bold">Delivery Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Delivery Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Monday - Saturday</span>
                      <span>7:00 AM - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>8:00 AM - 6:00 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Zones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Within Estate</span>
                      <span className="font-medium">KSh 100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Nearby Areas</span>
                      <span className="font-medium">KSh 200</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Important Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Orders over KSh 2,000 qualify for free delivery</li>
                  <li>• Delivery within 30-45 minutes</li>
                  <li>• Cash on delivery available</li>
                  <li>• M-Pesa payment accepted</li>
                  <li>• Fresh products guaranteed</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MtaaLoopMinimart;
