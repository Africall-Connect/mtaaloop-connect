import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const waveIn = (fromRight: boolean, delay: number) => ({
  initial: { x: fromRight ? 130 : -130, opacity: 0 },
  whileInView: { x: 0, opacity: 1 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 45, damping: 13, delay },
    opacity: { duration: 0.5, delay },
  },
});

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      
      <div className="container px-4 z-10 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div {...waveIn(false, 0)}>
            <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
          </motion.div>

          <motion.h2 {...waveIn(true, 0.1)} className="text-4xl md:text-7xl font-black text-white tracking-tight leading-[0.95]">
            Stop Scrolling.
            <span className="block mt-2 text-yellow-300">Start Living.</span>
          </motion.h2>

          <motion.p {...waveIn(false, 0.25)} className="text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed">
            Your neighbors are already ordering, discovering, connecting. 
            The only empty seat at this table is <span className="font-bold text-white">yours</span>.
          </motion.p>

          <motion.div {...waveIn(true, 0.4)} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" onClick={() => navigate('/auth/signup')}
              className="text-lg px-10 py-7 bg-white text-gray-900 hover:bg-gray-100 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 font-black">
              Join Free — Takes 30 Seconds <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth/login')}
              className="text-lg px-10 py-7 border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
              Welcome Back
            </Button>
          </motion.div>

          <motion.p {...waveIn(false, 0.55)} className="text-sm text-white/40 mt-6">
            Questions? <a href="mailto:hello.mtaaloop@africall.ke" className="underline text-white/60 hover:text-white">hello.mtaaloop@africall.ke</a>
          </motion.p>
        </div>
      </div>
    </section>
  );
};
