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
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const fromLeft: Variants = {
    hidden: { x: -120, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 70, damping: 14 },
    },
  };

  const fromRight: Variants = {
    hidden: { x: 120, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 70, damping: 14 },
    },
  };

  const statFromRight = (index: number): Variants => ({
    hidden: { x: 80 + index * 30, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 16,
        delay: index * 0.12,
      },
    },
  });

  return (
    <section ref={ref} className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.h2 variants={fromLeft} className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Already Home to Thriving Communities
          </motion.h2>
          <motion.p variants={fromRight} className="text-xl text-gray-600">
            Real buildings. Real neighbors. Real commerce happening right now.
          </motion.p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Royal Suburbs by Tsavo */}
          <motion.div
            variants={fromLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            whileInView={{ x: [0, 4, -4, 0] }}
            transition={{ x: { duration: 6, repeat: Infinity, repeatType: "mirror", delay: 1 } }}
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
                  The flagship Mtaaloop community. 2,000 families connected to their building's vendors, 
                  ordering daily essentials and discovering new services — all within arm's reach.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Coming Soon Card */}
          <motion.div
            variants={fromRight}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            whileInView={{ x: [0, -4, 4, 0] }}
            transition={{ x: { duration: 6, repeat: Infinity, repeatType: "mirror", delay: 1.5 } }}
            className="bg-white/80 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300 shadow-lg backdrop-blur-sm"
          >
            <h3 className="text-2xl font-bold mb-4 text-gray-700">Your Building Could Be Next</h3>
            <p className="text-gray-600 mb-6">
              Don't wait for someone else to bring Mtaaloop to your apartment. 
              Be the one who transforms your building into a thriving marketplace.
            </p>
            <Button
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-full"
              onClick={() => navigate('/auth/signup')}
            >
              Register Your Building
            </Button>
          </motion.div>

          {/* Stats wave in from right */}
          <div className="grid grid-cols-3 gap-6 mt-12 text-center">
            {[
              { value: "1,500+", label: "Happy Neighbors", color: "text-blue-500" },
              { value: "40+", label: "Building Vendors", color: "text-pink-500" },
              { value: "1", label: "Thriving Complex", color: "text-green-500" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                variants={statFromRight(i)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
