import { motion, Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { SectionSeparator } from "./SectionSeparator";
import { ComparisonBook } from "./ComparisonBook";
import { Clock, MapPin, Hourglass, Map, Smile, Frown } from 'lucide-react';
import "./ComparisonBook.css";

export const ProblemSection = () => {
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
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 14,
      },
    },
  };

  const fromRight: Variants = {
    hidden: { x: 120, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 14,
      },
    },
  };

  const headingVariant: Variants = {
    hidden: { x: -80, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 15,
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
          <motion.h2 variants={headingVariant} className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
            The Old Way is Broken. We Rebuilt It.
          </motion.h2>
          <motion.p variants={fromRight} className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            Other apps send strangers from across town. We keep everything inside your building — faster, safer, more personal.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto"
        >
          {/* Comparison 1 - slides from left */}
          <motion.div 
            variants={fromLeft}
            whileInView={{ x: [0, 5, -5, 0] }}
            transition={{ x: { duration: 6, repeat: Infinity, repeatType: "mirror", delay: 1 } }}
          >
            <ComparisonBook
              solutionSide="left"
              leftPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2 text-green-900" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Mtaaloop</h3>
                    <div className="flex justify-center items-center my-4">
                      <Clock className="w-12 h-12 text-green-700" />
                    </div>
                    <p className="text-gray-800 font-semibold">5-15 minutes. From your neighbor's kitchen to your door.</p>
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
                    <p className="text-gray-600">45-60 minutes from a stranger across the city. Cold food. Wrong orders.</p>
                  </div>
                  <Frown className="w-12 h-12 text-gray-400 mx-auto mt-4" />
                </div>
              }
            />
          </motion.div>

          {/* Comparison 2 - slides from right */}
          <motion.div 
            variants={fromRight}
            whileInView={{ x: [0, -5, 5, 0] }}
            transition={{ x: { duration: 6, repeat: Infinity, repeatType: "mirror", delay: 1.5 } }}
          >
            <ComparisonBook
              solutionSide="left"
              leftPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2 text-green-900" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Mtaaloop</h3>
                    <div className="flex justify-center items-center my-4">
                      <MapPin className="w-12 h-12 text-green-700" />
                    </div>
                    <p className="text-gray-800 font-semibold">Your building IS the marketplace. No guessing. No browsing.</p>
                  </div>
                  <Smile className="w-12 h-12 text-yellow-400 mx-auto mt-4" />
                </div>
              }
              rightPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Arial', sans-serif" }}>Location Apps</h3>
                    <div className="flex justify-center items-center my-4">
                      <Map className="w-12 h-12 text-gray-500" />
                    </div>
                    <p className="text-gray-600">Pick your neighborhood. Still too broad. Still impersonal.</p>
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
