import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ProductWithVendor {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  vendor_id: string;
  vendor: {
    business_name: string;
    slug: string;
  };
}

interface FeaturedProductBannerProps {
  products: ProductWithVendor[];
  onAddToCart: (product: ProductWithVendor) => void;
}

export const FeaturedProductBanner = ({ products, onAddToCart }: FeaturedProductBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();

  // Pick random starting index on mount
  useEffect(() => {
    if (products.length > 0) {
      const randomIndex = Math.floor(Math.random() * products.length);
      setCurrentIndex(randomIndex);
    }
  }, [products.length]);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  }, [products.length]);

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  }, [products.length]);

  const handleShopNow = () => {
    if (currentProduct) {
      onAddToCart(currentProduct);
    }
  };

  const handleSeeMore = () => {
    if (currentProduct?.vendor?.slug) {
      navigate(`/vendor/${currentProduct.vendor.slug}`);
    }
  };

  if (products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];

  if (!currentProduct) return null;

  return (
    <div className="relative w-full mb-6 rounded-xl overflow-hidden shadow-lg group">
      {/* Today's Pick Label */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
        <Badge className="bg-primary text-primary-foreground px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold">
          Today's Pick
        </Badge>
      </div>

      {/* Main Banner */}
      <div className="relative h-[180px] sm:h-[240px] md:h-[280px] w-full">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          {currentProduct.image_url ? (
            <>
              <img
                src={currentProduct.image_url}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 sm:w-24 sm:h-24 text-primary/20" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-6 md:p-8">
          <div className="max-w-lg">
            {/* Vendor Name */}
            <span className="text-white/70 text-xs sm:text-sm font-medium mb-1 block">
              {currentProduct.vendor.business_name}
            </span>

            {/* Product Name */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg line-clamp-2">
              {currentProduct.name}
            </h2>

            {/* Price */}
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">
              KES {currentProduct.price.toLocaleString()}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold touch-target"
                onClick={handleShopNow}
              >
                <ShoppingBag className="w-4 h-4 mr-1.5" />
                Shop Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 touch-target"
                onClick={handleSeeMore}
              >
                See More
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {products.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-target"
              aria-label="Previous product"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-target"
              aria-label="Next product"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {products.length > 1 && products.length <= 10 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {products.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
