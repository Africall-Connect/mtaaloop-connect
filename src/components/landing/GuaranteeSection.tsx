import { Rocket, Heart, Shield, RefreshCw } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { SectionSeparator } from "./SectionSeparator";

export const GuaranteeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const promises = [
    {
      icon: Rocket,
      title: "5-15 Minute Delivery",
      description: "From Your Building",
      color: "text-blue-500",
    },
    {
      icon: Heart,
      title: "Build Community",
      description: "Support Your Neighbors",
      color: "text-pink-500",
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "M-PESA Protected",
      color: "text-green-500",
    },
    {
      icon: RefreshCw,
      title: "Apartment-Exclusive",
      description: "Your Building's Marketplace",
      color: "text-blue-500",
    },
  ];

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
    <section ref={ref} className="relative py-24 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <motion.h2
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800"
        >
          Our Promise
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
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
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
