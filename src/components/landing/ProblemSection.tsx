import { motion, Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { SectionSeparator } from "./SectionSeparator";
import { ComparisonBook } from "./ComparisonBook";
import { Clock, Users, MapPin, Hourglass, Map, Smile, Frown } from 'lucide-react';
import { CustomerIllustration } from './CustomerIllustration';
import { DeliveryIllustration } from './DeliveryIllustration';
import "./ComparisonBook.css";

export const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section ref={ref} className="relative py-24 bg-gradient-to-br from-yellow-50 via-blue-50 to-pink-50">
      <div className="container px-4 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
            Why Mtaaloop Is Radically Different
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            A side-by-side look at how we're revolutionizing local delivery.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto"
        >
          {/* Comparison 1 */}
          <motion.div variants={itemVariants}>
            <ComparisonBook
              solutionSide="left"
              leftPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2 text-green-900" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Mtaaloop</h3>
                    <div className="flex justify-center items-center my-4">
                      <Clock className="w-12 h-12 text-green-700" />
                    </div>
                    <p className="text-gray-800 font-semibold">5-15 minute delivery from your building community.</p>
                  </div>
                  <Smile className="w-12 h-12 text-yellow-400 mx-auto mt-4" />
                </div>
              }
              rightPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Arial', sans-serif" }}>Generic Apps</h3>
                    <div className="flex justify-center items-center my-4">
                      <Hourglass className="w-12 h-12 text-gray-500" />
                    </div>
                    <p className="text-gray-600">45-60 minute delivery from strangers across town.</p>
                  </div>
                  <Frown className="w-12 h-12 text-gray-400 mx-auto mt-4" />
                </div>
              }
            />
          </motion.div>

          {/* Comparison 2 */}
          <motion.div variants={itemVariants}>
            <ComparisonBook
              solutionSide="left"
              leftPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2 text-green-900" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Mtaaloop</h3>
                    <div className="flex justify-center items-center my-4">
                      <MapPin className="w-12 h-12 text-green-700" />
                    </div>
                    <p className="text-gray-800 font-semibold">Your apartment building IS your marketplace - no choosing.</p>
                  </div>
                  <Smile className="w-12 h-12 text-yellow-400 mx-auto mt-4" />
                </div>
              }
              rightPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Arial', sans-serif" }}>Location-Based Apps</h3>
                    <div className="flex justify-center items-center my-4">
                      <Map className="w-12 h-12 text-gray-500" />
                    </div>
                    <p className="text-gray-600">Choose your neighborhood or area - still too broad.</p>
                  </div>
                  <Frown className="w-12 h-12 text-gray-400 mx-auto mt-4" />
                </div>
              }
            />
          </motion.div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
