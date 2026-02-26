import { Rocket, Heart, Shield, RefreshCw } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { SectionSeparator } from "./SectionSeparator";

export const GuaranteeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const promises = [
    {
      icon: Rocket,
      title: "Absurdly Fast Delivery",
      description: "5-15 minutes. Because your vendor is literally upstairs.",
      color: "text-blue-500",
    },
    {
      icon: Heart,
      title: "Neighbors, Not Strangers",
      description: "Every purchase strengthens your building's micro-economy.",
      color: "text-pink-500",
    },
    {
      icon: Shield,
      title: "M-PESA Fortress",
      description: "Every transaction is locked, verified, and instant. Sleep easy.",
      color: "text-green-500",
    },
    {
      icon: RefreshCw,
      title: "Your Building Only",
      description: "An exclusive marketplace that belongs to your apartment complex alone.",
      color: "text-blue-500",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const headingVariant: Variants = {
    hidden: { x: -80, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 80, damping: 15 },
    },
  };

  const getItemVariant = (index: number): Variants => ({
    hidden: { x: -100 - index * 20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 14,
        delay: index * 0.1,
      },
    },
  });

  return (
    <section ref={ref} className="relative py-24 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <motion.h2
          variants={headingVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800"
        >
          Our Promise to You
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
        >
          {promises.map((promise, index) => (
            <motion.div
              key={index}
              variants={getItemVariant(index)}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              whileInView={{ x: [0, 5, -5, 0] }}
              transition={{ x: { duration: 5 + index, repeat: Infinity, repeatType: "mirror", delay: 2 + index * 0.3 } }}
              whileHover={{ x: 8, transition: { duration: 0.2 } }}
              className="text-center space-y-4 group"
            >
              <div className="inline-flex p-6 rounded-full bg-white/80 border-2 border-gray-200 transition-all duration-300 shadow-lg backdrop-blur-sm">
                <promise.icon className={`w-12 h-12 ${promise.color} transition-transform duration-300`} />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800">{promise.title}</h3>
              <p className="text-gray-600">{promise.description}</p>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-12 h-1 ${promise.color.replace("text", "bg")} mx-auto rounded-full`} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
