import { useParams, useNavigate } from "react-router-dom";
import { VendorNavbar } from "@/components/vendor/VendorNavbar";
import { VendorProductCard } from "@/components/vendor/VendorProductCard";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getVendorById } from "@/data/vendors";

export default function VendorSubcategory() {
  const { vendorSlug, categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();
  
  const vendorId = vendorSlug || "";
  const vendor = getVendorById(vendorId);

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
          <button onClick={() => navigate('/home')} className="text-primary hover:underline">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Convert slug back to category name
  const subcategoryName = subcategorySlug?.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || "Products";

  const products = vendor.menu.filter(m => 
    m.category.toLowerCase().replace(/\s+/g, '-') === subcategorySlug
  );

  return (
    <div className="min-h-screen bg-background">
      <VendorNavbar 
        vendor={{ ...vendor, slug: vendorSlug, logo_url: vendor.images[0] } as any} 
        selectedSubcategory={subcategorySlug || null}
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
              <BreadcrumbLink onClick={() => navigate(`/vendor/${vendorSlug}/category/${categorySlug}`)} className="cursor-pointer">
                {categorySlug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subcategoryName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{subcategoryName}</h1>
          <p className="text-muted-foreground">{products.length} products available</p>
        </div>

        {/* Content: Sidebar + Products */}
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-card border rounded-lg p-4 sticky top-24">
              <h3 className="font-bold mb-4">Filters</h3>
              
              {/* Price Range */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <div className="flex items-center gap-2">
                  <Input placeholder="Min" type="number" className="text-sm" />
                  <span className="text-muted-foreground">-</span>
                  <Input placeholder="Max" type="number" className="text-sm" />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Rating</label>
                {["4.5+", "4.0+", "3.5+"].map(rating => (
                  <div key={rating} className="flex items-center gap-2 mb-2">
                    <Checkbox id={rating} />
                    <label htmlFor={rating} className="text-sm cursor-pointer">{rating} Stars</label>
                  </div>
                ))}
              </div>

              <Button className="w-full">
                Apply Filters
              </Button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">{products.length} products</p>
              
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map(product => (
                <VendorProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => navigate(`/vendor/${vendorSlug}/product/${product.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}