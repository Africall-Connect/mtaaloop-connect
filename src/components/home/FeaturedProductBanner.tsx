import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Easing } from "framer-motion";

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

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 1.08,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: EASE },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-40%" : "40%",
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.5, ease: EASE },
  }),
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};


export const FeaturedProductBanner = ({ products, onAddToCart }: FeaturedProductBannerProps) => {
  const [[currentIndex, direction], setSlide] = useState([0, 0]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);
  const navigate = useNavigate();

  const AUTO_INTERVAL = 6000;

  // Pick random starting index
  useEffect(() => {
    if (products.length > 0) {
      setSlide([Math.floor(Math.random() * products.length), 0]);
    }
  }, [products.length]);

  // Auto-rotate
  useEffect(() => {
    if (!isAutoPlaying || isPaused || products.length <= 1) return;

    timerRef.current = setInterval(() => {
      setSlide(([prev]) => [(prev + 1) % products.length, 1]);
    }, AUTO_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlaying, isPaused, products.length]);

  const paginate = useCallback((newDirection: number) => {
    setIsAutoPlaying(false);
    setSlide(([prev]) => [
      (prev + newDirection + products.length) % products.length,
      newDirection,
    ]);
  }, [products.length]);

  const goToSlide = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setSlide(([prev]) => [index, index > prev ? 1 : -1]);
  }, []);

  if (products.length === 0) return null;

  const currentProduct = products[currentIndex];
  if (!currentProduct) return null;

  const handleShopNow = () => onAddToCart(currentProduct);
  const handleSeeMore = () => {
    if (currentProduct?.vendor?.slug) navigate(`/vendor/${currentProduct.vendor.slug}`);
  };

  return (
    <div
      className="relative w-full mb-6 rounded-2xl overflow-hidden shadow-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Auto-play progress bar */}
      {isAutoPlaying && products.length > 1 && (
        <div className="absolute top-0 left-0 right-0 z-30 h-0.5">
          <motion.div
            className="h-full bg-primary"
            key={currentIndex}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTO_INTERVAL / 1000, ease: "linear" }}
          />
        </div>
      )}

      {/* Today's Pick */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
        <Badge className="bg-primary text-primary-foreground px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold shadow-lg">
          ✨ Today's Pick
        </Badge>
      </div>

      {/* Slide counter */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
        <span className="text-white/70 text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
          {currentIndex + 1} / {Math.min(products.length, 10)}
        </span>
      </div>

      {/* Main Banner with AnimatePresence */}
      <div className="relative h-[200px] sm:h-[260px] md:h-[320px] w-full">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              {currentProduct.image_url ? (
                <>
                  <img
                    src={currentProduct.image_url}
                    alt={currentProduct.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20 flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-primary/20" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-7 md:p-10">
              <div className="max-w-lg">
                <motion.span
                  custom={0}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-white/60 text-xs sm:text-sm font-medium mb-1 block tracking-wide uppercase"
                >
                  {currentProduct.vendor.business_name}
                </motion.span>

                <motion.h2
                  custom={1}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg line-clamp-2 leading-tight"
                >
                  {currentProduct.name}
                </motion.h2>

                <motion.div
                  custom={2}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4"
                >
                  KES {currentProduct.price.toLocaleString()}
                </motion.div>

                <motion.div
                  custom={3}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex gap-2 sm:gap-3"
                >
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg touch-target"
                    onClick={handleShopNow}
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    Shop Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/25 touch-target"
                    onClick={handleSeeMore}
                  >
                    See More
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {products.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-2 sm:p-2.5 rounded-full backdrop-blur-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-target shadow-lg"
              aria-label="Previous product"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-2 sm:p-2.5 rounded-full backdrop-blur-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-target shadow-lg"
              aria-label="Next product"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator — enhanced pill style */}
      {products.length > 1 && products.length <= 10 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5">
          {products.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 h-2 bg-primary shadow-md"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
