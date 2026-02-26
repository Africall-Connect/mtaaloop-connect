import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SectionSeparator } from "./SectionSeparator";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

export const SocialProof = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <div className="text-center mb-12">
          <motion.h2 {...fadeUp(0)} className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Already Home to Thriving Communities
          </motion.h2>
          <motion.p {...fadeUp(0.1)} className="text-xl text-gray-600">
            Real buildings. Real neighbors. Real commerce happening right now.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            {...fadeUp(0.2)}
            className="bg-white/80 rounded-2xl p-8 mb-8 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">Royal Suburbs by Tsavo</h3>
                <div className="flex flex-wrap gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-800">2,000 Units</span>
                  <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-800">4 Phases</span>
                  <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-800">500 Units per Phase</span>
                </div>
                <p className="text-gray-600">
                  The flagship Mtaaloop community. 2,000 families connected to their building's vendors, 
                  ordering daily essentials and discovering new services — all within arm's reach.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp(0.3)}
            className="bg-white/80 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow duration-300"
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

          <div className="grid grid-cols-3 gap-6 mt-12 text-center">
            {[
              { value: "1,500+", label: "Happy Neighbors", color: "text-blue-500" },
              { value: "40+", label: "Building Vendors", color: "text-pink-500" },
              { value: "1", label: "Thriving Complex", color: "text-green-500" },
            ].map((stat, i) => (
              <motion.div key={stat.label} {...fadeUp(0.4 + i * 0.1)}>
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
