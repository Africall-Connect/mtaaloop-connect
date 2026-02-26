import { motion } from "framer-motion";
import { Clock, MapPin, Hourglass, Map, Smile, Frown } from 'lucide-react';
import { ComparisonBook } from "./ComparisonBook";
import "./ComparisonBook.css";

const waveIn = (fromRight: boolean, delay: number) => ({
  initial: { x: fromRight ? 150 : -150, opacity: 0, rotate: fromRight ? 3 : -3 },
  whileInView: { x: 0, opacity: 1, rotate: 0 },
  viewport: { once: true },
  transition: {
    x: { type: "spring" as const, stiffness: 45, damping: 14, delay },
    opacity: { duration: 0.5, delay },
    rotate: { type: "spring" as const, stiffness: 60, damping: 15, delay: delay + 0.05 },
  },
});

export const ProblemSection = () => {
  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <div className="container px-4 z-10 relative">
        <motion.div {...waveIn(false, 0)} className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-bold mb-4">The Problem</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Delivery Apps Lied to You.
          </h2>
        </motion.div>
        
        <motion.p {...waveIn(true, 0.15)} className="text-lg text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          They promised convenience but gave you cold food from strangers 45 minutes away. 
          We said <span className="font-bold text-gray-800">enough</span>.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div {...waveIn(false, 0.25)}>
            <ComparisonBook
              solutionSide="left"
              leftPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-black text-2xl mb-2 text-emerald-800">Mtaaloop</h3>
                    <div className="flex justify-center items-center my-4">
                      <Clock className="w-12 h-12 text-emerald-600" />
                    </div>
                    <p className="text-gray-800 font-semibold">5-15 minutes. Your neighbor cooked it. You taste the love.</p>
                  </div>
                  <Smile className="w-10 h-10 text-yellow-400 mx-auto mt-3" />
                </div>
              }
              rightPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2 text-gray-400">Other Apps</h3>
                    <div className="flex justify-center items-center my-4">
                      <Hourglass className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-500">45-60 min. Cold. Wrong order. From a stranger 12km away.</p>
                  </div>
                  <Frown className="w-10 h-10 text-gray-300 mx-auto mt-3" />
                </div>
              }
            />
          </motion.div>

          <motion.div {...waveIn(true, 0.4)}>
            <ComparisonBook
              solutionSide="left"
              leftPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-black text-2xl mb-2 text-emerald-800">Mtaaloop</h3>
                    <div className="flex justify-center items-center my-4">
                      <MapPin className="w-12 h-12 text-emerald-600" />
                    </div>
                    <p className="text-gray-800 font-semibold">Your building IS the marketplace. Zero noise.</p>
                  </div>
                  <Smile className="w-10 h-10 text-yellow-400 mx-auto mt-3" />
                </div>
              }
              rightPageContent={
                <div className="text-center p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-bold text-2xl mb-2 text-gray-400">Location Apps</h3>
                    <div className="flex justify-center items-center my-4">
                      <Map className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-500">"Pick your area." Still too broad. Still impersonal.</p>
                  </div>
                  <Frown className="w-10 h-10 text-gray-300 mx-auto mt-3" />
                </div>
              }
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
