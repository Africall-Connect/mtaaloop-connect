import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SpotlightVendor {
  id: string;
  business_name: string;
  slug: string;
  cover_image_url: string | null;
  tagline: string | null;
  rating: number;
  business_type: string;
  delivery_time: string | null;
  is_open: boolean;
}

interface VendorSpotlightProps {
  vendors: SpotlightVendor[];
}

export const VendorSpotlight = ({ vendors }: VendorSpotlightProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const navigate = useNavigate();

  // Get top 10 vendors sorted by rating
  const topVendors = [...vendors]
    .filter(v => v.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  useEffect(() => {
    if (!isAutoPlaying || topVendors.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topVendors.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, topVendors.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + topVendors.length) % topVendors.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % topVendors.length);
  };

  const handleViewVendor = (slug: string) => {
    navigate(`/vendor/${slug}`);
  };

  if (topVendors.length === 0) {
    return null;
  }

  const currentVendor = topVendors[currentIndex];

  return (
    <div className="relative w-full mb-6 sm:mb-8 rounded-xl overflow-hidden shadow-2xl group">
      {/* Spotlight Label */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20">
        <Badge className="bg-white/90 backdrop-blur-sm text-black hover:bg-white px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold">
          #{currentIndex + 1} Spotlight
        </Badge>
      </div>

      {/* Main Banner - Responsive heights */}
      <div className="relative h-[260px] sm:h-[350px] md:h-[450px] w-full">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          {currentVendor.cover_image_url ? (
            <>
              <img
                src={currentVendor.cover_image_url}
                alt={currentVendor.business_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Store className="w-24 h-24 sm:w-40 sm:h-40 text-primary/20" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-8 md:p-12">
          <div className="max-w-2xl">
            {/* Rating */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4 flex-wrap">
              <div className="flex items-center gap-1 bg-yellow-500 text-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                <span className="font-bold text-xs sm:text-sm">{currentVendor.rating.toFixed(1)}</span>
              </div>
              {currentVendor.is_open && (
                <Badge className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 py-0.5 gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Open
                </Badge>
              )}
              {currentVendor.delivery_time && (
                <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-xs sm:text-sm px-2 py-0.5">
                  {currentVendor.delivery_time}
                </Badge>
              )}
            </div>

            {/* Business Name */}
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg line-clamp-2">
              {currentVendor.business_name}
            </h2>

            {/* Category */}
            <Badge className="bg-primary/80 backdrop-blur-sm hover:bg-primary mb-2 sm:mb-4 text-xs sm:text-sm">
              {currentVendor.business_type}
            </Badge>

            {/* Tagline - Hidden on very small screens */}
            {currentVendor.tagline && (
              <p className="hidden sm:block text-base md:text-xl text-white/90 mb-4 sm:mb-6 drop-shadow-md line-clamp-2">
                {currentVendor.tagline}
              </p>
            )}

            {/* Action Buttons - Stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                size="default"
                className="bg-white text-black hover:bg-white/90 font-semibold touch-target"
                onClick={() => handleViewVendor(currentVendor.slug)}
              >
                Order Now
              </Button>
              <Button
                size="default"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 touch-target"
                onClick={() => handleViewVendor(currentVendor.slug)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows - Always visible on touch devices */}
        {topVendors.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-target"
              aria-label="Previous spotlight"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-target"
              aria-label="Next spotlight"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {topVendors.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {topVendors.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
              }}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to spotlight ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
