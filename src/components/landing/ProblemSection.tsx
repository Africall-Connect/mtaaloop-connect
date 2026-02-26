import { motion } from "framer-motion";
import { Clock, MapPin, Hourglass, Map, Smile, Frown } from 'lucide-react';
import { ComparisonBook } from "./ComparisonBook";
import "./ComparisonBook.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

export const ProblemSection = () => {
  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-pink-50 overflow-hidden">
      <div className="container px-4 z-10 relative">
        <motion.h2 {...fadeUp(0)} className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
          The Old Way is Broken. We Rebuilt It.
        </motion.h2>
        <motion.p {...fadeUp(0.1)} className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          Other apps send strangers from across town. We keep everything inside your building — faster, safer, more personal.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <motion.div {...fadeUp(0.2)}>
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

          <motion.div {...fadeUp(0.35)}>
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
        </div>
      </div>
    </section>
  );
};
