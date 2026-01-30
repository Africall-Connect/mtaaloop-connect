import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { VendorNavbar } from "@/components/vendor/VendorNavbar";
import { VendorProductCard } from "@/components/vendor/VendorProductCard";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVendorById } from "@/data/vendors";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { vendorSlug, productSlug } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();

  const vendorId = vendorSlug || "";
  const vendor = getVendorById(vendorId);
  const product = vendor?.menu.find(p => p.id === productSlug);

  if (!vendor || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <button onClick={() => navigate('/home')} className="text-primary hover:underline">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const relatedProducts = vendor.menu.filter(m => m.category === product.category && m.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
    });
    
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <VendorNavbar 
        vendor={{ ...vendor, slug: vendorSlug, logo_url: vendor.images[0] } as any} 
        selectedSubcategory={null}
        onSubcategoryChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/home')} className="cursor-pointer">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(`/vendor/${vendorSlug}`)} className="cursor-pointer">
                {vendor.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(`/vendor/${vendorSlug}/category/all`)} className="cursor-pointer">
                {product.category}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div>
            <img 
              src={product.image || vendor.images[0]} 
              alt={product.name}
              className="w-full aspect-square object-cover rounded-2xl mb-4"
            />
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.rating}</span>
                <span className="text-muted-foreground">({product.ordersThisWeek} orders this week)</span>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-primary">
                KSh {product.price}
              </span>
            </div>

            <p className="text-muted-foreground mb-8">{product.description}</p>

            {/* Quantity */}
            <div className="mb-8">
              <label className="font-medium mb-3 block">Quantity</label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button 
              size="lg" 
              className="w-full mb-4"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart - KSh {product.price * quantity}
            </Button>

            {/* Tabs */}
            <Tabs defaultValue="details" className="mt-8">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <div className="py-4">
                  <p className="text-muted-foreground">{product.description}</p>
                  {product.customizations && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Customization Options:</h4>
                      {product.customizations.spiceLevels && (
                        <p className="text-sm text-muted-foreground">Spice Levels: {product.customizations.spiceLevels.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="reviews">
                <div className="py-4">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(related => (
                <VendorProductCard 
                  key={related.id} 
                  product={related} 
                  onClick={() => navigate(`/vendor/${vendorSlug}/product/${related.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}