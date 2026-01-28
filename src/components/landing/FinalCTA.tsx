import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { SectionSeparator } from "./SectionSeparator";

export const FinalCTA = () => {
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

  return (
    <section ref={ref} className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 text-gray-800">
      <div className="container px-4 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-extrabold">
            Join Your Apartment's Digital Community
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            Sign up now and get access to your building's exclusive marketplace.
            Free to join, instant access.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth/signup')}
              className="text-lg px-8 py-6 bg-blue-500 text-white hover:bg-blue-600 rounded-full transition-all duration-300 shadow-xl"
            >
              Create Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth/login')}
              className="text-lg px-8 py-6 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white rounded-full transition-all duration-300"
            >
              Sign In
            </Button>
          </motion.div>

          <motion.p variants={itemVariants} className="text-sm text-gray-600 mt-8">
            Questions? Email us at <a href="mailto:hello.mtaaloop@africall.ke" className="underline">hello.mtaaloop@africall.ke</a>
          </motion.p>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
