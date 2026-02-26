import { Rocket, Heart, Shield, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

export const GuaranteeSection = () => {
  const promises = [
    { icon: Rocket, title: "Absurdly Fast Delivery", description: "5-15 minutes. Because your vendor is literally upstairs.", color: "text-blue-500" },
    { icon: Heart, title: "Neighbors, Not Strangers", description: "Every purchase strengthens your building's micro-economy.", color: "text-pink-500" },
    { icon: Shield, title: "M-PESA Fortress", description: "Every transaction is locked, verified, and instant. Sleep easy.", color: "text-green-500" },
    { icon: RefreshCw, title: "Your Building Only", description: "An exclusive marketplace that belongs to your apartment complex alone.", color: "text-blue-500" },
  ];

  return (
    <section className="h-screen flex flex-col justify-center bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100 overflow-hidden">
      <div className="container px-4 z-10 relative">
        <motion.h2 {...fadeUp(0)} className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800">
          Our Promise to You
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {promises.map((promise, index) => (
            <motion.div
              key={index}
              {...fadeUp(0.1 + index * 0.1)}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="text-center space-y-4 group"
            >
              <div className="inline-flex p-6 rounded-full bg-white/80 border-2 border-gray-200 transition-all duration-300 shadow-lg backdrop-blur-sm group-hover:shadow-xl">
                <promise.icon className={`w-12 h-12 ${promise.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{promise.title}</h3>
              <p className="text-gray-600">{promise.description}</p>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-12 h-1 ${promise.color.replace("text", "bg")} mx-auto rounded-full`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
