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

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 text-gray-800">
      <div className="container px-4 z-10 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.h2 {...fadeUp(0)} className="text-4xl md:text-6xl font-extrabold">
            Your Building is Waiting. Are You?
          </motion.h2>

          <motion.p {...fadeUp(0.1)} className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            Hundreds of your neighbors are already shopping, selling, and connecting.
            The only thing missing is you. Join free. Start instantly.
          </motion.p>

          <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth/signup')}
              className="text-lg px-8 py-6 bg-blue-500 text-white hover:bg-blue-600 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              Claim Your Spot — Free Forever
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth/login')}
              className="text-lg px-8 py-6 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white rounded-full transition-all duration-300 hover:-translate-y-0.5"
            >
              Welcome Back, Neighbor
            </Button>
          </motion.div>

          <motion.p {...fadeUp(0.3)} className="text-sm text-gray-600 mt-8">
            Questions? Email us at <a href="mailto:hello.mtaaloop@africall.ke" className="underline">hello.mtaaloop@africall.ke</a>
          </motion.p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
