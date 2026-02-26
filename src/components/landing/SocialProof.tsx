import { Building2, Users, Store, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const waveIn = (fromRight: boolean, delay: number) => ({
  initial: { x: fromRight ? 130 : -130, opacity: 0 },
  whileInView: { x: 0, opacity: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 45, damping: 13, delay },
    opacity: { duration: 0.5, delay },
  },
});

export const SocialProof = () => {
  const navigate = useNavigate();

  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 overflow-hidden">
      <div className="container px-4 z-10 relative">
        <motion.div {...waveIn(true, 0)} className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">Social Proof</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Already Alive & Thriving.
          </h2>
          <p className="text-lg text-gray-500 mt-3 max-w-xl mx-auto">Real buildings. Real neighbors. Real commerce.</p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div {...waveIn(false, 0.2)}
            className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2 text-gray-900">Royal Suburbs by Tsavo</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["2,000 Units", "4 Phases", "500/Phase"].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-50 rounded-full text-xs font-bold text-blue-700">{tag}</span>
                  ))}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  The flagship Mtaaloop community. 2,000 families ordering daily essentials, discovering hidden gems, 
                  and building a micro-economy — all within arm's reach.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div {...waveIn(true, 0.35)}
            className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 text-center border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors duration-300"
          >
            <h3 className="text-2xl font-black mb-3 text-gray-800">Your Building Is Next.</h3>
            <p className="text-gray-500 mb-5 text-sm max-w-md mx-auto">
              Don't wait. Be the legend who brought Mtaaloop to your apartment.
            </p>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg" 
              onClick={() => navigate('/auth/signup')}>
              Register Your Building
            </Button>
          </motion.div>

          {/* Stats wave in */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, value: "1,500+", label: "Happy Neighbors", gradient: "from-blue-500 to-cyan-400" },
              { icon: Store, value: "40+", label: "Building Vendors", gradient: "from-pink-500 to-rose-400" },
              { icon: TrendingUp, value: "1", label: "Thriving Complex", gradient: "from-emerald-500 to-teal-400" },
            ].map((stat, i) => (
              <motion.div key={stat.label} {...waveIn(i % 2 === 0, 0.5 + i * 0.1)}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/40 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-2 shadow`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
