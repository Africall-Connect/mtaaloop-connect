import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { CustomerIllustration } from "./CustomerIllustration";
import { VendorIllustration } from "./VendorIllustration";
import { DeliveryIllustration } from "./DeliveryIllustration";
import { SectionSeparator } from "./SectionSeparator";

export const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const steps = [
    {
      illustration: <CustomerIllustration />,
      title: "Sign Up for Your Building",
      description: "Create your account and register your apartment. Each building has its own exclusive Mtaalopp marketplace."
    },
    {
      illustration: <VendorIllustration />,
      title: "Shop Your Community",
      description: "Browse vendors inside your building and nearby businesses that serve your apartment complex. Everything is relevant."
    },
    {
      illustration: <DeliveryIllustration />,
      title: "Get It in 5-15 Minutes",
      description: "Because we're truly hyperlocal. Your order comes from your building or within 500m. No long-distance deliveries."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
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
    <section ref={ref} className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
            One Building. One Community. One Marketplace.
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            Not city-wide chaos. Not neighborhood confusion. Just YOUR apartment's marketplace.
          </motion.p>

          <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants} className="text-center">
                <div className="flex items-center justify-center mb-6">
                  {step.illustration}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
