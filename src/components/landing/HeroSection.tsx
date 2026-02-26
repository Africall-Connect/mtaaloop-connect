import { Button } from "@/components/ui/button";
import { LogIn, ChevronDown, Sparkles, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FloatingIcons } from "./FloatingIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { CartoonIllustrations } from "./CartoonIllustrations";
import { supabase } from "@/integrations/supabase/client";

// Dreamy wave: items slide in from alternating sides, settle with overshoot
const waveFromLeft = (delay: number) => ({
  initial: { x: -120, opacity: 0, scale: 0.95 },
  whileInView: { x: 0, opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 50, damping: 12, delay },
    opacity: { duration: 0.6, delay },
    scale: { duration: 0.5, delay: delay + 0.1 },
  },
});

const waveFromRight = (delay: number) => ({
  initial: { x: 120, opacity: 0, scale: 0.95 },
  whileInView: { x: 0, opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 50, damping: 12, delay },
    opacity: { duration: 0.6, delay },
    scale: { duration: 0.5, delay: delay + 0.1 },
  },
});

export const HeroSection = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const handleTryConnect = () => {
    navigate('/mtaaloop');
  };

  return (
    <section className="relative h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-sky-50 to-rose-50">
      <CartoonIllustrations />
      <FloatingIcons />

      {/* Announcement - waves in from right */}
      <motion.div
        {...waveFromRight(0.1)}
        className="absolute top-16 left-0 right-0 z-30 mx-6"
      >
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-3 px-6 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold tracking-wide">MtaaLoop Connect — Live Now</span>
              <span className="hidden sm:inline text-white/80 text-sm">Random video chats with your actual neighbors</span>
            </div>
            <Button size="sm" onClick={handleTryConnect}
              className="bg-white/20 text-white hover:bg-white/30 font-semibold border border-white/20 backdrop-blur-sm rounded-xl">
              Try It
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Nav - waves in from left */}
      <motion.nav {...waveFromLeft(0)}
        className="absolute top-0 w-full py-4 px-6 flex justify-between items-center z-20"
      >
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Mtaaloop Logo" className="h-14 w-14 object-contain" />
          <span className="text-2xl font-black text-gray-900 tracking-tight">Mtaaloop</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleTryConnect} className="gap-1 rounded-xl">
            <Video className="h-4 w-4" /> Connect
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 rounded-xl">
                Partners <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-50">
              <DropdownMenuItem onClick={() => navigate('/auth/vendor-signup')}>Join as Vendor</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/auth/estate-signup')}>Register Estate</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/auth/rider-signup')}>Become a Rider</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" onClick={() => navigate('/auth/login')} className="rounded-xl">Log In</Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={() => navigate('/auth/signup')}>Get Started</Button>
        </div>
      </motion.nav>

      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Badge waves from left */}
          <motion.div {...waveFromLeft(0.2)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-sm font-semibold text-gray-700 shadow-sm"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Live in Your Building Right Now
          </motion.div>

          {/* Title waves from right */}
          <motion.h1 {...waveFromRight(0.35)}
            className="text-5xl md:text-8xl font-black tracking-tight leading-[0.95]"
          >
            <span className="block text-gray-900">Your Building.</span>
            <span className="block mt-1 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Your Marketplace.
            </span>
          </motion.h1>

          {/* Subtitle waves from left */}
          <motion.p {...waveFromLeft(0.5)}
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            Every meal, every service, every hidden gem — from someone who shares your elevator. 
            Not a city away. Not a neighborhood away. <span className="font-semibold text-gray-700">Right here.</span>
          </motion.p>

          {/* CTAs wave from right */}
          <motion.div {...waveFromRight(0.65)}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2"
          >
            <Button size="lg" onClick={() => navigate('/auth/signup')}
              className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              Claim Your Building — Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth/login')}
              className="text-lg px-10 py-7 border-2 border-gray-300 text-gray-700 hover:border-gray-500 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
              <LogIn className="mr-2 h-5 w-5" /> Welcome Back
            </Button>
          </motion.div>

          {/* Stats wave in one by one from left */}
          <div className="grid grid-cols-3 gap-6 pt-8 max-w-xl mx-auto">
            {[
              { value: "5–15min", label: "Delivery" },
              { value: "2,000+", label: "Residents" },
              { value: "40+", label: "Vendors" },
            ].map((stat, i) => (
              <motion.div key={stat.label} {...waveFromLeft(0.8 + i * 0.12)}
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/40 shadow-sm"
              >
                <div className="text-2xl md:text-3xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
