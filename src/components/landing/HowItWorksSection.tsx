import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { CustomerIllustration } from "./CustomerIllustration";
import { VendorIllustration } from "./VendorIllustration";
import { DeliveryIllustration } from "./DeliveryIllustration";
import { SectionSeparator } from "./SectionSeparator";

export const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const steps = [
    {
      illustration: <CustomerIllustration />,
      title: "Claim Your Building",
      description: "Sign up, pick your apartment complex, and instantly unlock a marketplace that exists only for your neighbors. No city-wide noise — just your building."
    },
    {
      illustration: <VendorIllustration />,
      title: "Discover Hidden Gems",
      description: "The best chef might live two floors up. The freshest juice bar? Right downstairs. Browse vendors you never knew existed — all inside your own building."
    },
    {
      illustration: <DeliveryIllustration />,
      title: "Blink and It's There",
      description: "5-15 minutes. That's not a promise — it's physics. When your vendor is 30 seconds away, delivery isn't a wait. It's a doorbell."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const headingFromLeft = {
    hidden: { x: -80, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 80, damping: 15 },
    },
  };

  const headingFromRight = {
    hidden: { x: 80, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 80, damping: 15 },
    },
  };

  // Each step slides from alternating directions with spring bounce
  const getStepVariant = (index: number) => ({
    hidden: { x: index === 0 ? -120 : index === 2 ? 120 : 0, opacity: 0, scale: 0.9 },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 60 + index * 20,
        damping: 12,
        delay: index * 0.12,
      },
    },
  });

  return (
    <section ref={ref} className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.h2 variants={headingFromLeft} className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
            Three Steps. Zero Hassle. Infinite Convenience.
          </motion.h2>
          <motion.p variants={headingFromRight} className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            Not city-wide chaos. Not neighborhood confusion. Just YOUR apartment's marketplace, ready in seconds.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                variants={getStepVariant(index)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                whileInView={{ x: [0, index === 1 ? 0 : (index === 0 ? 4 : -4), 0] }}
                transition={{ x: { duration: 5, repeat: Infinity, repeatType: "mirror", delay: 2 } }}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-6">
                  {step.illustration}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
