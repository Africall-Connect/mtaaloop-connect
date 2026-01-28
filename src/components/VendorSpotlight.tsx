import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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
    <div className="relative w-full mb-8 rounded-xl overflow-hidden shadow-2xl group">
      {/* Spotlight Label */}
      <div className="absolute top-6 left-6 z-20">
        <Badge className="bg-white/90 backdrop-blur-sm text-black hover:bg-white px-4 py-2 text-sm font-bold">
          #{currentIndex + 1} Spotlight
        </Badge>
      </div>

      {/* Main Banner */}
      <div className="relative h-[400px] md:h-[500px] w-full">
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
              <span className="text-9xl opacity-20">🏪</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
          <div className="max-w-2xl">
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-sm">{currentVendor.rating.toFixed(1)}</span>
              </div>
              {currentVendor.is_open && (
                <Badge className="bg-green-600 hover:bg-green-700">
                  🟢 Open Now
                </Badge>
              )}
              {currentVendor.delivery_time && (
                <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20">
                  {currentVendor.delivery_time}
                </Badge>
              )}
            </div>

            {/* Business Name */}
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {currentVendor.business_name}
            </h2>

            {/* Category */}
            <Badge className="bg-primary/80 backdrop-blur-sm hover:bg-primary mb-4">
              {currentVendor.business_type}
            </Badge>

            {/* Tagline */}
            {currentVendor.tagline && (
              <p className="text-lg md:text-xl text-white/90 mb-6 drop-shadow-md line-clamp-2">
                {currentVendor.tagline}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-semibold"
                onClick={() => handleViewVendor(currentVendor.slug)}
              >
                Order Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                onClick={() => handleViewVendor(currentVendor.slug)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {topVendors.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous spotlight"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next spotlight"
            >
              <ChevronRight className="w-6 h-6" />
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
