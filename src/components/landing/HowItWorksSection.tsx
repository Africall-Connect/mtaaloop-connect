import { motion } from "framer-motion";
import { CustomerIllustration } from "./CustomerIllustration";
import { VendorIllustration } from "./VendorIllustration";
import { DeliveryIllustration } from "./DeliveryIllustration";
import { SectionSeparator } from "./SectionSeparator";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
});

export const HowItWorksSection = () => {
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

  return (
    <section className="relative py-20 bg-gradient-to-br from-yellow-100 via-blue-100 to-pink-100">
      <div className="container px-4 z-10 relative">
        <motion.h2 {...fadeUp(0)} className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
          Three Steps. Zero Hassle. Infinite Convenience.
        </motion.h2>
        <motion.p {...fadeUp(0.1)} className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
          Not city-wide chaos. Not neighborhood confusion. Just YOUR apartment's marketplace, ready in seconds.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              {...fadeUp(0.15 + index * 0.15)}
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
      </div>
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <SectionSeparator />
      </div>
    </section>
  );
};
