import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { SectionSeparator } from "./SectionSeparator";

export const SocialProof = () => {
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -100 : 100,
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  const statsVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const statItemVariants: Variants = {
    hidden: { scale: 0.5, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <section ref={ref} className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Already Trusted By
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xl text-gray-600">
            Real apartment communities using Mtaalopp today
          </motion.p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Royal Suburbs by Tsavo */}
          <motion.div
            custom="left"
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="bg-white/80 rounded-2xl p-8 mb-8 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Royal Suburbs by Tsavo</h3>
                <div className="flex flex-wrap gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-800">
                    2,000 Units
                  </span>
                  <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-800">
                    4 Phases
                  </span>
                  <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-800">
                    500 Units per Phase
                  </span>
                </div>
                <p className="text-gray-600">
                  The largest apartment community on Mtaalopp. Residents enjoy access to vendors
                  from all phases plus nearby businesses within 500m radius. Fast deliveries, strong community.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Coming Soon Card */}
          <motion.div
            custom="right"
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="bg-white/80 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300 shadow-lg backdrop-blur-sm"
          >
            <h3 className="text-2xl font-bold mb-4 text-gray-700">Your Apartment Building Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              Don't see your building? Register it and we'll set up your exclusive marketplace.
            </p>
            <Button
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-full"
              onClick={() => navigate('/auth/signup')}
            >
              Register Your Building
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={statsVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-3 gap-6 mt-12 text-center"
          >
            <motion.div variants={statItemVariants}>
              <div className="text-3xl font-bold text-blue-500 mb-2">1,500+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </motion.div>
            <motion.div variants={statItemVariants}>
              <div className="text-3xl font-bold text-pink-500 mb-2">40+</div>
              <div className="text-sm text-gray-600">Active Vendors</div>
            </motion.div>
            <motion.div variants={statItemVariants}>
              <div className="text-3xl font-bold text-green-500 mb-2">1</div>
              <div className="text-sm text-gray-600">Apartment Complex</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
