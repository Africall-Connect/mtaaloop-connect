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
import { SectionSeparator } from "./SectionSeparator";
import { supabase } from "@/integrations/supabase/client";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      {/* Announcement Bar */}
      <div className="absolute top-16 left-0 right-0 z-30 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 mx-6 rounded-lg shadow-lg border border-white/20">
        <div className="container mx-auto flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold">New: MtaaLoop Connect is Live!</span>
            <span className="hidden sm:inline text-white/90">Meet your neighbors through random video chats</span>
          </div>
          <Button
            size="sm"
            onClick={handleTryConnect}
            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold border border-white/30"
          >
            Try Connect
          </Button>
        </div>
      </div>

      <CartoonIllustrations />
      <FloatingIcons />

      {/* Top Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 w-full py-4 px-6 flex justify-between items-center z-20"
      >
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Mtaaloop Logo" 
            className="h-16 w-16 object-contain" 
          />
          <span className="text-2xl font-bold text-gray-900">Mtaaloop</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleTryConnect} className="gap-1">
            <Video className="h-4 w-4" />
            Connect
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1">
                For Partners <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-50">
              <DropdownMenuItem onClick={() => navigate('/auth/vendor-signup')}>
                🏪 Join as Vendor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/auth/estate-signup')}>
                🏢 Register Estate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/auth/rider-signup')}>
                🏍️ Become a Rider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" onClick={() => navigate('/auth/login')}>
            Log In
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => navigate('/auth/signup')}>
            Get Started
          </Button>
        </div>
      </motion.nav>

      <div className="container px-4 py-20 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-gray-700"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
          >
            <span className="block">Your Apartment Building.</span>
            <span className="block mt-2 text-gradient">Your Marketplace.</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
          >
            Every apartment complex gets its own Mtaaloop. Shop from vendors inside your building
            and nearby businesses that serve your community. Delivered in 5-15 minutes.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => navigate('/auth/signup')}
                className="group text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all duration-300 shadow-lg"
              >
                Create Account - It's Free
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth/login')}
                className="text-lg px-8 py-6 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white rounded-full transition-all duration-300"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Already Have Account?
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto"
          >
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">5-15min</div>
              <div className="text-sm text-gray-900 font-medium">Delivery Time</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">2,000+</div>
              <div className="text-sm text-gray-900 font-medium">Apartment Units</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">40+</div>
              <div className="text-sm text-gray-900 font-medium">Vendors</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
