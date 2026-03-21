import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Store, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface SpotlightVendor {
  id: string;
  business_name: string;
  slug: string;
  cover_image_url: string | null;
  logo_url: string | null;
  tagline: string | null;
  rating: number;
  business_type: string;
  delivery_time: string | null;
  is_open: boolean;
}

interface Props {
  vendors: SpotlightVendor[];
}

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
  exit: (d: number) => ({ x: d > 0 ? "-50%" : "50%", opacity: 0, transition: { duration: 0.45, ease: EASE } }),
};

const textVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.2 + i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

export const VendorSpotlightBanner = ({ vendors }: Props) => {
  const [[currentIndex, direction], setSlide] = useState([0, 0]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const AUTO_INTERVAL = 6000;

  const featured = vendors.filter(v => v.cover_image_url).slice(0, 10);

  useEffect(() => {
    if (featured.length > 0) setSlide([Math.floor(Math.random() * featured.length), 0]);
  }, [featured.length]);

  useEffect(() => {
    if (!isAutoPlaying || isPaused || featured.length <= 1) return;
    const timer = setInterval(() => {
      setSlide(([prev]) => [(prev + 1) % featured.length, 1]);
    }, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isPaused, featured.length]);

  const paginate = useCallback((d: number) => {
    setIsAutoPlaying(false);
    setSlide(([prev]) => [(prev + d + featured.length) % featured.length, d]);
  }, [featured.length]);

  const goToSlide = useCallback((i: number) => {
    setIsAutoPlaying(false);
    setSlide(([prev]) => [i, i > prev ? 1 : -1]);
  }, []);

  if (featured.length === 0) return null;
  const vendor = featured[currentIndex];
  if (!vendor) return null;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Auto-play progress bar */}
      {isAutoPlaying && featured.length > 1 && (
        <div className="absolute top-0 left-0 right-0 z-30 h-[3px]">
          <motion.div className="h-full bg-primary/80 rounded-r-full" key={currentIndex}
            initial={{ width: "0%" }} animate={{ width: "100%" }}
            transition={{ duration: AUTO_INTERVAL / 1000, ease: "linear" }}
          />
        </div>
      )}

      {/* Featured badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
        <Badge className="bg-primary text-primary-foreground px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] font-bold shadow-lg border-0">
          <Store className="w-3 h-3 mr-1" /> Featured
        </Badge>
      </div>

      {/* Slide counter */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
        <span className="text-white/80 text-[11px] font-medium bg-black/30 backdrop-blur-md px-2 py-1 rounded-full">
          {currentIndex + 1}/{featured.length}
        </span>
      </div>

      {/* Main slide area */}
      <div className="relative h-[200px] sm:h-[260px] md:h-[320px] lg:h-[360px] w-full">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div key={currentIndex} custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" className="absolute inset-0">
            <div className="absolute inset-0">
              <img src={vendor.cover_image_url!} alt={vendor.business_name}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-7 md:p-10">
              <div className="max-w-lg space-y-2.5">
                <motion.div custom={0} variants={textVariants} initial="hidden" animate="visible"
                  className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-white/15 backdrop-blur-md text-white text-[11px] capitalize border-0">
                    {vendor.business_type?.replace(/-/g, " ")}
                  </Badge>
                  {vendor.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {vendor.rating.toFixed(1)}
                    </span>
                  )}
                  {vendor.is_open && (
                    <Badge className="bg-emerald-600/90 text-white text-[11px] border-0 gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Open
                    </Badge>
                  )}
                </motion.div>

                <motion.h2 custom={1} variants={textVariants} initial="hidden" animate="visible"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                  {vendor.business_name}
                </motion.h2>

                <motion.p custom={2} variants={textVariants} initial="hidden" animate="visible"
                  className="text-sm sm:text-base text-white/75 line-clamp-1">
                  {vendor.tagline || "Discover our products & services"}
                </motion.p>

                <motion.div custom={3} variants={textVariants} initial="hidden" animate="visible"
                  className="flex gap-2.5 pt-1">
                  <Button size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg rounded-lg h-9"
                    onClick={() => navigate(`/vendor/${vendor.slug}`)}>
                    <Store className="w-4 h-4 mr-1.5" /> Visit Store
                  </Button>
                  <Button size="sm" variant="outline"
                    className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-lg h-9"
                    onClick={() => navigate(`/vendor/${vendor.slug}`)}>
                    Browse <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {featured.length > 1 && (
          <>
            <button onClick={() => paginate(-1)}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-lg"
              aria-label="Previous vendor">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => paginate(1)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-lg"
              aria-label="Next vendor">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot navigation */}
      {featured.length > 1 && featured.length <= 10 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/25 backdrop-blur-md rounded-full px-2.5 py-1.5">
          {featured.map((_, i) => (
            <button key={i} onClick={() => goToSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-6 h-2 bg-primary shadow-sm" : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to vendor ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
};
